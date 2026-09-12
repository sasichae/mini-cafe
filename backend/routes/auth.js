const express = require('express')
const router = express.Router()
const users = require('../data/users')

router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอก Username และ Password'
    })
  }

  const user = users.find(
    u => u.username === username && u.password === password
  )

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Username หรือ Password ไม่ถูกต้อง'
    })
  }

  const redirectUrl = user.role === 'admin'
    ? '/admin/dashboard'
    : '/staff/order'

  res.json({
    success: true,
    message: 'Login สำเร็จ',
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    },
    redirectUrl
  })
})

module.exports = router
