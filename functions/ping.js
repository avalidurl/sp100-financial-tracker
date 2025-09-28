export async function onRequest() {
  const now = new Date().toISOString();
  return new Response(JSON.stringify({ ok: true, time: now }), {
    headers: { 'content-type': 'application/json' }
  });
}
