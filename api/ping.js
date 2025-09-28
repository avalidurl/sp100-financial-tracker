module.exports = async function handler(req, res) {
  return res.status(200).json({ ok: true, path: '/api/ping', time: new Date().toISOString() });
}

