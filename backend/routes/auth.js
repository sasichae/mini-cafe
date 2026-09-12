const express = require('express')
const router = express.Router()
const pool = require('../db')

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอก Username และ Password'
    })
  }

  try {
    const [rows] = await pool.execute(
      'SELECT user_id, username, role FROM users WHERE username = ? AND password = ?',
      [username, password]
    )

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username หรือ Password ไม่ถูกต้อง'
      })
    }

    const user = rows[0]
    const redirectUrl = user.role === 'admin'
      ? '/admin/dashboard'
      : '/staff/order'

    res.json({
      success: true,
      message: 'Login สำเร็จ',
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role
      },
      redirectUrl
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'
    })
  }
})

module.exports = router
