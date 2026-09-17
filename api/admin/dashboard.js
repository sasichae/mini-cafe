const { getPool } = require('../_lib/db')
const { authenticate } = require('../_lib/middleware')
const { setCorsHeaders } = require('../_lib/cors')

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

  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' })
  }

  try {
    const pool = getPool()

    const orderStats = await pool.query(
      'SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue FROM orders'
    )

    const todayStats = await pool.query(
      `SELECT COUNT(*) as today_orders, COALESCE(SUM(total_amount), 0) as today_revenue
       FROM orders WHERE DATE(created_at) = CURRENT_DATE`
    )

    const statusCounts = await pool.query(
      `SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
       FROM orders`
    )

    const productStats = await pool.query(
      `SELECT COUNT(*) as total_products,
              SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) as available
       FROM products`
    )

    const userStats = await pool.query('SELECT COUNT(*) as total_users FROM users')

    res.json({
      success: true,
      data: {
        orders: { total: parseInt(orderStats.rows[0].total_orders), today: parseInt(todayStats.rows[0].today_orders) },
        revenue: { total: parseFloat(orderStats.rows[0].total_revenue), today: parseFloat(todayStats.rows[0].today_revenue) },
        status: {
          pending: parseInt(statusCounts.rows[0].pending) || 0,
          preparing: parseInt(statusCounts.rows[0].preparing) || 0,
          completed: parseInt(statusCounts.rows[0].completed) || 0,
          cancelled: parseInt(statusCounts.rows[0].cancelled) || 0
        },
        products: { total: parseInt(productStats.rows[0].total_products), available: parseInt(productStats.rows[0].available) },
        users: parseInt(userStats.rows[0].total_users)
      }
    })
  } catch (error) {
    console.error('Admin dashboard stats error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
}
