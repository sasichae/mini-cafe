require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const categoriesRoutes = require('./routes/categories')
const productsRoutes = require('./routes/products')
const ordersRoutes = require('./routes/orders')
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

app.get('/api/admin/dashboard', authenticate, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Admin Dashboard',
    user: req.user
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
