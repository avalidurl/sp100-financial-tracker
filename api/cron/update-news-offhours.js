export default async function handler(request, response) {
  try {
    if (request.method !== 'GET') {
      return response.status(405).json({ error: 'Method not allowed' });
    }
    const workerUrl = process.env.WORKER_BASE_URL;
    const workerToken = process.env.WORKER_TOKEN;
    if (!workerUrl) {
      return response.status(500).json({ error: 'WORKER_BASE_URL not configured' });
    }
    const resp = await fetch(`${workerUrl}/update-news`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': workerToken ? `Bearer ${workerToken}` : undefined
      },
      body: JSON.stringify({ source: 'vercel-cron', cadence: 'offhours' })
    });
    const body = await resp.text();
    return response.status(resp.status).send(body);
  } catch (error) {
    return response.status(500).json({ error: String(error) });
  }
}

