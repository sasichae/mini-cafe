const { getPool } = require('../../../_lib/db')
const { authenticate } = require('../../../_lib/middleware')
const { setCorsHeaders } = require('../../../_lib/cors')

module.exports = async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const user = authenticate(req, res)
  if (!user) return

  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  const { id } = req.query
  const { status } = req.body
  const validStatuses = ['pending', 'preparing', 'completed', 'cancelled']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง (pending, preparing, completed, cancelled)' })
  }

  try {
    const pool = getPool()
    const result = await pool.query('UPDATE orders SET status = $1 WHERE order_id = $2', [status, id])

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบ Order นี้' })
    }

    res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
}
