const { authenticate } = require('./_lib/middleware')
const { setCorsHeaders } = require('./_lib/cors')

module.exports = async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const user = authenticate(req, res)
  if (!user) return

  res.json({ success: true, user })
}
