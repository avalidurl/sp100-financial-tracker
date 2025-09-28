import { writeJsonIfChanged } from './_utils.js';

export async function onRequest({ env }) {
  const now = new Date().toISOString();
  try {
    await writeJsonIfChanged(env, 'public/data/last_updated.json', { market_caps: now });
    return new Response(JSON.stringify({ status: 'ok', type: 'market_caps', last_run: now }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
