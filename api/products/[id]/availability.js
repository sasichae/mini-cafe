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
  const { is_available } = req.body

  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ success: false, message: 'is_available ต้องเป็น true หรือ false' })
  }

  try {
    const pool = getPool()
    const result = await pool.query(
      'UPDATE products SET is_available = $1 WHERE product_id = $2',
      [is_available, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' })
    }

    res.json({ success: true, message: is_available ? 'เปิดขายสินค้าแล้ว' : 'ปิดขายสินค้าแล้ว' })
  } catch (error) {
    console.error('Update availability error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
}
