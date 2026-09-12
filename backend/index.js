require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const categoriesRoutes = require('./routes/categories')
const productsRoutes = require('./routes/products')
const ordersRoutes = require('./routes/orders')
const pool = require('./db')
const { authenticate } = require('./middleware/auth')
const { authorize } = require('./middleware/authorize')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/orders', ordersRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user
  })
})

app.get('/api/admin/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [[orderStats]] = await pool.execute(
      'SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue FROM orders'
    )

    const [[todayStats]] = await pool.execute(
      `SELECT COUNT(*) as today_orders, COALESCE(SUM(total_amount), 0) as today_revenue
       FROM orders WHERE DATE(created_at) = CURDATE()`
    )

    const [[statusCounts]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
       FROM orders`
    )

    const [[productStats]] = await pool.execute(
      `SELECT COUNT(*) as total_products,
              SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available
       FROM products`
    )

    const [[userStats]] = await pool.execute(
      `SELECT COUNT(*) as total_users FROM users`
    )

    res.json({
      success: true,
      data: {
        orders: {
          total: orderStats.total_orders,
          today: todayStats.today_orders
        },
        revenue: {
          total: orderStats.total_revenue,
          today: todayStats.today_revenue
        },
        status: {
          pending: statusCounts.pending || 0,
          preparing: statusCounts.preparing || 0,
          completed: statusCounts.completed || 0,
          cancelled: statusCounts.cancelled || 0
        },
        products: {
          total: productStats.total_products,
          available: productStats.available
        },
        users: userStats.total_users
      }
    })
  } catch (error) {
    console.error('Admin dashboard stats error:', error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
