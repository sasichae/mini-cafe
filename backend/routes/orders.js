const express = require('express')
const router = express.Router()
const pool = require('../db')
const { authenticate } = require('../middleware/auth')

router.post('/', authenticate, async (req, res) => {
  const { items } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'
    })
  }

  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    let totalAmount = 0

    const productIds = items.map(item => item.product_id)
    const [products] = await connection.execute(
      `SELECT product_id, price, is_available FROM products WHERE product_id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    )

    const productMap = {}
    for (const product of products) {
      productMap[product.product_id] = product
    }

    const validatedItems = []
    for (const item of items) {
      const product = productMap[item.product_id]

      if (!product) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: `ไม่พบสินค้า ID ${item.product_id}`
        })
      }

      if (!product.is_available) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: `สินค้า ${item.product_id} ไม่พร้อมขาย`
        })
      }

      if (!item.quantity || item.quantity < 1) {
        await connection.rollback()
        return res.status(400).json({
          success: false,
          message: 'จำนวนสินค้าต้องมากกว่า 0'
        })
      }

      const unitPrice = parseFloat(product.price)
      const total = unitPrice * item.quantity
      totalAmount += total

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        total
      })
    }

    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [req.user.id, totalAmount, 'pending']
    )

    const orderId = orderResult.insertId

    for (const item of validatedItems) {
      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price, item.total]
      )
    }

    await connection.commit()

    res.json({
      success: true,
      message: 'สร้าง Order สำเร็จ',
      data: {
        order_id: orderId,
        total_amount: totalAmount,
        status: 'pending',
        items: validatedItems
      }
    })
  } catch (error) {
    await connection.rollback()
    console.error('Create order error:', error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'
    })
  } finally {
    connection.release()
  }
})

module.exports = router
