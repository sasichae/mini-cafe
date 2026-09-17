const { getPool } = require('../../../_lib/db')
const { authenticate } = require('../../../_lib/middleware')
const { setCorsHeaders } = require('../../../_lib/cors')

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

  const { id } = req.query

  try {
    const pool = getPool()
    const ordersResult = await pool.query(
      `SELECT o.order_id, o.user_id, o.total_amount, o.status, o.created_at, u.username
       FROM orders o LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = $1 AND (o.user_id = $2 OR $3 = 'admin')`,
      [id, user.id, user.role]
    )

    if (ordersResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบ Order นี้' })
    }

    const order = ordersResult.rows[0]

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi LEFT JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [order.order_id]
    )
    order.items = itemsResult.rows

    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
}
