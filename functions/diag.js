export async function onRequest({ env }) {
  const owner = !!env.GITHUB_OWNER;
  const repo = !!env.GITHUB_REPO_NAME;
  const hasToken = !!env.GITHUB_TOKEN;
  let githubAuthOk = null;
  
  if (hasToken) {
    const r = await fetch('https://api.github.com/rate_limit', {
      headers: { 
        Authorization: `Bearer ${env.GITHUB_TOKEN}`, 
        Accept: 'application/vnd.github+json',
        'User-Agent': 'sp100-financial-tracker/1.0'
      }
    });
    githubAuthOk = r.status;
  }
  
  return new Response(JSON.stringify({ owner, repo, hasToken, githubAuthOk }), {
    headers: { 'content-type': 'application/json' }
  });
}
