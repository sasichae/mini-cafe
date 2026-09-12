const express = require('express')
const router = express.Router()
const pool = require('../db')
const { authenticate } = require('../middleware/auth')

router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categories ORDER BY category_id')
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
})

module.exports = router
