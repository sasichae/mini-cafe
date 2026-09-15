const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const router = express.Router()
const pool = require('../db')
const { JWT_SECRET } = require('../middleware/auth')

const SALT_ROUNDS = 10

router.post('/register', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอก Username และ Password'
    })
  }

  if (password.trim().length < 6) {
    return res.status(400).json({
      success: false,
      message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    })
  }

  try {
    const [existing] = await pool.execute(
      'SELECT user_id FROM users WHERE username = ?',
      [username]
    )

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username นี้ถูกใช้ไปแล้ว'
      })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, 'staff']
    )

    res.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ'
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'
    })
  }
})

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
      'SELECT user_id, username, password, role FROM users WHERE username = ?',
      [username]
    )

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username หรือ Password ไม่ถูกต้อง'
      })
    }

    const user = rows[0]
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username หรือ Password ไม่ถูกต้อง'
      })
    }

    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      message: 'Login สำเร็จ',
      token,
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role
      }
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
