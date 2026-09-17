const bcrypt = require('bcrypt')
const { getPool } = require('../_lib/db')
const { setCorsHeaders } = require('../_lib/cors')

module.exports = async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอก Username และ Password' })
  }

  if (password.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  }

  try {
    const pool = getPool()
    const existing = await pool.query('SELECT user_id FROM users WHERE username = $1', [username])

    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Username นี้ถูกใช้ไปแล้ว' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, hashedPassword, 'staff'])

    res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ' })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
}
