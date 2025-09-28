const { writeJsonIfChanged } = require('../_lib/github');

module.exports = async function handler(request, response) {
  try {
    if (request.method !== 'GET') {
      return response.status(405).json({ error: 'Method not allowed' });
    }
    const now = new Date().toISOString();
    // TODO: replace with real data fetch logic
    await writeJsonIfChanged('public/data/last_updated.json', { quarterly: now });
    return response.status(200).json({ status: 'ok', type: 'quarterly', last_run: now });
  } catch (error) {
    return response.status(500).json({ error: String(error) });
  }
}

