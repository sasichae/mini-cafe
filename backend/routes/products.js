const express = require('express')
const router = express.Router()
const pool = require('../db')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

// GET /api/products — ดึงสินค้า (Admin เห็นทั้งหมด, Staff เห็นเฉพาะที่เปิดขาย)
router.get('/', authenticate, async (req, res) => {
  const { category_id, show_all } = req.query

  try {
    let query = 'SELECT * FROM products'
    const params = []
    const conditions = []

    if (req.user.role !== 'admin' || show_all !== 'true') {
      conditions.push('is_available = TRUE')
    }

    if (category_id) {
      conditions.push('category_id = ?')
      params.push(category_id)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY product_id'

    const [rows] = await pool.execute(query, params)
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
})

// GET /api/products/:id — ดึงสินค้าตัวเดียว
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE product_id = ?',
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

// POST /api/products — เพิ่มสินค้าใหม่ (Admin เท่านั้น)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, price, category_id, description, image } = req.body

  if (!name || !price || !category_id) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกชื่อสินค้า, ราคา, และหมวดหมู่'
    })
  }

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ราคาต้องมากกว่า 0'
    })
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO products (name, price, category_id, description, image) VALUES (?, ?, ?, ?, ?)',
      [name, parsedPrice, parseInt(category_id), description || null, image || null]
    )

    res.json({
      success: true,
      message: 'เพิ่มสินค้าสำเร็จ',
      data: { product_id: result.insertId }
    })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
})

// PUT /api/products/:id — แก้ไขสินค้า (Admin เท่านั้น)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params
  const { name, price, category_id, description, image } = req.body

  if (!name || !price || !category_id) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกชื่อสินค้า, ราคา, และหมวดหมู่'
    })
  }

  const parsedPrice = parseFloat(price)
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ราคาต้องมากกว่า 0'
    })
  }

  try {
    const [result] = await pool.execute(
      'UPDATE products SET name = ?, price = ?, category_id = ?, description = ?, image = ? WHERE product_id = ?',
      [name, parsedPrice, parseInt(category_id), description || null, image || null, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' })
    }

    res.json({ success: true, message: 'แก้ไขสินค้าสำเร็จ' })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
})

// DELETE /api/products/:id — ลบสินค้า (Admin เท่านั้น)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params

  try {
    const [existing] = await pool.execute(
      'SELECT product_id FROM products WHERE product_id = ?',
      [id]
    )

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' })
    }

    const [orders] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM order_items WHERE product_id = ?',
      [id]
    )

    if (orders[0].cnt > 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่สามารถลบสินค้าได้ เนื่องจากมีรายการสั่งซื้อที่เกี่ยวข้อง'
      })
    }

    await pool.execute('DELETE FROM products WHERE product_id = ?', [id])

    res.json({ success: true, message: 'ลบสินค้าสำเร็จ' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
})

// PATCH /api/products/:id/availability — เปลี่ยนสถานะเปิด/ปิดขาย (Admin เท่านั้น)
router.patch('/:id/availability', authenticate, authorize('admin'), async (req, res) => {
  const { id } = req.params
  const { is_available } = req.body

  if (typeof is_available !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'is_available ต้องเป็น true หรือ false'
    })
  }

  try {
    const [result] = await pool.execute(
      'UPDATE products SET is_available = ? WHERE product_id = ?',
      [is_available, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' })
    }

    res.json({
      success: true,
      message: is_available ? 'เปิดขายสินค้าแล้ว' : 'ปิดขายสินค้าแล้ว'
    })
  } catch (error) {
    console.error('Update availability error:', error)
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
  }
})

module.exports = router
