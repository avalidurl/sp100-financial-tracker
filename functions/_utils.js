const GITHUB_API = 'https://api.github.com';

export function requireEnv(env, name) {
  const v = env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export function toBase64Utf8(str) {
  // Cloudflare Workers don't have Buffer; encode UTF-8 safely
  return btoa(unescape(encodeURIComponent(str)));
}

export async function putFile(env, path, contentString, message, branch = 'master') {
  const owner = requireEnv(env, 'GITHUB_OWNER');
  const repo = requireEnv(env, 'GITHUB_REPO_NAME');
  const token = requireEnv(env, 'GITHUB_TOKEN');
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const getShaUrl = `${url}?ref=${encodeURIComponent(branch)}`;
  let sha = null;
  {
    const r = await fetch(getShaUrl, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'sp500-capex-scheduler/1.0' } });
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
      'Content-Type': 'application/json',
      'User-Agent': 'sp500-capex-scheduler/1.0'
    },
    body: JSON.stringify(body)
  });
  if (resp.status !== 200 && resp.status !== 201) {
    throw new Error(`GitHub write failed: ${resp.status} ${await resp.text()}`);
  }
  return await resp.json();
}

export async function writeJsonIfChanged(env, path, data, branch = 'master') {
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
