module.exports = async function handler(req, res) {
  res.setHeader('content-type', 'application/json');
  return res.status(200).end(JSON.stringify({ message: 'Hello from Vercel API' }));
}

