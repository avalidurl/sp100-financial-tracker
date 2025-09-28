const GITHUB_API = 'https://api.github.com';

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`${name} is not configured`);
  }
  return v;
}

function ghHeaders() {
  const token = requireEnv('GITHUB_TOKEN');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

function repoFullName() {
  const owner = requireEnv('GITHUB_OWNER');
  const name = requireEnv('GITHUB_REPO_NAME');
  return `${owner}/${name}`;
}

function repoFullName() {
  const owner = requireEnv('GITHUB_OWNER');
  const name = requireEnv('GITHUB_REPO_NAME');
  return `${owner}/${name}`;
}

async function getFileSha(path, branch = 'master') {
  const repo = repoFullName();
  const url = `${GITHUB_API}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const resp = await fetch(url, { headers: ghHeaders() });
  if (resp.status === 200) {
    const data = await resp.json();
    return data.sha || null;
  }
  return null;
}

async function fetchRaw(path, branch = 'master') {
  const repo = repoFullName();
  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
  const resp = await fetch(url);
  if (resp.status === 200) {
    return new Uint8Array(await resp.arrayBuffer());
  }
  return null;
}

async function putFile(path, contentBytes, message, branch = 'master') {
  const repo = repoFullName();
  const sha = await getFileSha(path, branch);
  const url = `${GITHUB_API}/repos/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message,
    content: Buffer.from(contentBytes).toString('base64'),
    branch
  };
  if (sha) body.sha = sha;
  const resp = await fetch(url, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
  if (![200, 201].includes(resp.status)) {
    const text = await resp.text();
    throw new Error(`GitHub write failed: ${resp.status} ${text}`);
  }
  return await resp.json();
}

async function writeJsonIfChanged(path, data, branch = 'master') {
  const newBytes = Buffer.from(JSON.stringify(data));
  const current = await fetchRaw(path, branch);
  if (current && Buffer.compare(Buffer.from(current), newBytes) === 0) {
    return null;
  }
  return await putFile(path, newBytes, `Update ${path} ${new Date().toISOString()}`, branch);
}

module.exports = {
  getFileSha,
  fetchRaw,
  putFile,
  writeJsonIfChanged,
};


