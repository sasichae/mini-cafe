require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const { authenticate } = require('./middleware/auth')
const { authorize } = require('./middleware/authorize')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

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

app.get('/api/staff/order', authenticate, authorize('staff', 'admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Staff Order Page',
    user: req.user
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
