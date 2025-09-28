const GITHUB_API = 'https://api.github.com';

function requireEnv(env, name) {
  const v = env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

function toBase64Utf8(str) {
  // Cloudflare Workers don't have Buffer; encode UTF-8 safely
  return btoa(unescape(encodeURIComponent(str)));
}

async function putFile(env, path, contentString, message, branch = 'master') {
  const owner = requireEnv(env, 'GITHUB_OWNER');
  const repo = requireEnv(env, 'GITHUB_REPO_NAME');
  const token = requireEnv(env, 'GITHUB_TOKEN');
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const getShaUrl = `${url}?ref=${encodeURIComponent(branch)}`;
  let sha = null;
  {
    const r = await fetch(getShaUrl, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
    if (r.status === 200) sha = (await r.json()).sha || null;
  }
  const body = {
    message,
    content: toBase64Utf8(contentString),
    branch,
    ...(sha ? { sha } : {})
  };
  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (resp.status !== 200 && resp.status !== 201) {
    throw new Error(`GitHub write failed: ${resp.status} ${await resp.text()}`);
  }
  return await resp.json();
}

async function writeJsonIfChanged(env, path, data, branch = 'master') {
  const owner = requireEnv(env, 'GITHUB_OWNER');
  const repo = requireEnv(env, 'GITHUB_REPO_NAME');
  const newString = JSON.stringify(data);
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const current = await fetch(rawUrl);
  if (current.status === 200) {
    const currentString = await current.text();
    if (currentString === newString) return null;
  }
  return await putFile(env, path, newString, `Update ${path} ${new Date().toISOString()}`, branch);
}

export default {
  async scheduled(event, env, ctx) {
    const minute = new Date(event.scheduledTime).getUTCMinutes();
    const hour = new Date(event.scheduledTime).getUTCHours();
    // Simple routing using the cron expressions order
    // 0: update-data (Mon/Thu 06:00)
    // 1: update-market-caps (Weekdays 18:00)
    // 2: update-news (market hours every 30m)
    // 3: update-news (offhours every 2h)

    // Placeholder logic: write last_updated markers
    const now = new Date().toISOString();
    try {
      if (hour === 6 && (new Date(event.scheduledTime).getUTCDay() === 1 || new Date(event.scheduledTime).getUTCDay() === 4)) {
        await writeJsonIfChanged(env, 'public/data/last_updated.json', { quarterly: now });
      } else if (hour === 18 && new Date(event.scheduledTime).getUTCDay() >= 1 && new Date(event.scheduledTime).getUTCDay() <= 5) {
        await writeJsonIfChanged(env, 'public/data/last_updated.json', { market_caps: now });
      } else if (hour >= 13 && hour <= 22 && new Date(event.scheduledTime).getUTCDay() >= 1 && new Date(event.scheduledTime).getUTCDay() <= 5) {
        await writeJsonIfChanged(env, 'data/last_updated.json', { news: now });
      } else {
        await writeJsonIfChanged(env, 'data/last_updated.json', { news_offhours: now });
      }
    } catch (e) {
      console.error(e);
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const now = new Date().toISOString();
    if (url.pathname === '/ping') {
      return new Response(JSON.stringify({ ok: true, time: now }), { headers: { 'content-type': 'application/json' } });
    }
    if (url.pathname === '/diag') {
      // Non-sensitive diagnostics
      const owner = !!env.GITHUB_OWNER;
      const repo = !!env.GITHUB_REPO_NAME;
      const hasToken = !!env.GITHUB_TOKEN;
      let githubAuthOk = null;
      if (hasToken) {
        const r = await fetch('https://api.github.com/rate_limit', {
          headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
        });
        githubAuthOk = r.status;
      }
      return new Response(JSON.stringify({ owner, repo, hasToken, githubAuthOk }), { headers: { 'content-type': 'application/json' } });
    }
    if (url.pathname === '/update-data') {
      try {
        await writeJsonIfChanged(env, 'public/data/last_updated.json', { quarterly: now });
        return new Response(JSON.stringify({ status: 'ok', type: 'quarterly', last_run: now }), { headers: { 'content-type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'content-type': 'application/json' } });
      }
    }
    if (url.pathname === '/update-market-caps') {
      try {
        await writeJsonIfChanged(env, 'public/data/last_updated.json', { market_caps: now });
        return new Response(JSON.stringify({ status: 'ok', type: 'market_caps', last_run: now }), { headers: { 'content-type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'content-type': 'application/json' } });
      }
    }
    if (url.pathname === '/update-news') {
      try {
        await writeJsonIfChanged(env, 'data/last_updated.json', { news: now });
        return new Response(JSON.stringify({ status: 'ok', type: 'news', last_run: now }), { headers: { 'content-type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'content-type': 'application/json' } });
      }
    }
    return new Response('Not Found', { status: 404 });
  }
}


