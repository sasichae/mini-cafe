const { getPool } = require('./_lib/db')
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

  try {
    const pool = getPool()
    const result = await pool.query('SELECT * FROM categories ORDER BY category_id')
    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
}
