const express = require('express')
const router = express.Router()
const pool = require('../db')
const { authenticate } = require('../middleware/auth')

router.get('/', authenticate, async (req, res) => {
  const { category_id } = req.query

  try {
    let query = 'SELECT * FROM products WHERE is_available = TRUE'
    const params = []

    if (category_id) {
      query += ' AND category_id = ?'
      params.push(category_id)
    }

    query += ' ORDER BY product_id'

    const [rows] = await pool.execute(query, params)
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE product_id = ? AND is_available = TRUE',
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' })
    }

    res.json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
})

module.exports = router
