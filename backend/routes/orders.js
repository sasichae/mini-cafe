const express = require('express')
const router = express.Router()
const pool = require('../db')
const { authenticate } = require('../middleware/auth')
const { authorize } = require('../middleware/authorize')

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query
    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled']

    let sql = `SELECT o.order_id, o.user_id, o.total_amount, o.status, o.created_at,
                      u.username,
                      oi.order_item_id, oi.product_id, oi.quantity, oi.unit_price, oi.total as item_total,
                      p.name as product_name
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.user_id
               LEFT JOIN order_items oi ON o.order_id = oi.order_id
               LEFT JOIN products p ON oi.product_id = p.product_id`
    const params = []

    if (status && validStatuses.includes(status)) {
      sql += ' WHERE o.status = ?'
      params.push(status)
    }

    sql += ' ORDER BY o.created_at DESC'

    const [rows] = await pool.execute(sql, params)

    const orderMap = new Map()
    for (const row of rows) {
      if (!orderMap.has(row.order_id)) {
        orderMap.set(row.order_id, {
          order_id: row.order_id,
          user_id: row.user_id,
          total_amount: row.total_amount,
          status: row.status,
          created_at: row.created_at,
          username: row.username,
          items: []
        })
      }
      if (row.order_item_id) {
        orderMap.get(row.order_id).items.push({
          order_item_id: row.order_item_id,
          product_id: row.product_id,
          quantity: row.quantity,
          unit_price: row.unit_price,
          total: row.item_total,
          product_name: row.product_name
        })
      }
    }

    res.json({
      success: true,
      data: Array.from(orderMap.values())
    })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'
    })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT o.order_id, o.user_id, o.total_amount, o.status, o.created_at,
              u.username
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ? AND (o.user_id = ? OR ? = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    )

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ Order นี้'
      })
    }

    const order = orders[0]

    const [items] = await pool.execute(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [order.order_id]
    )
    order.items = items

    res.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'
    })
  }
})

router.patch('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  const { status } = req.body
  const validStatuses = ['pending', 'preparing', 'completed', 'cancelled']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'สถานะไม่ถูกต้อง (pending, preparing, completed, cancelled)'
    })
  }

  try {
    const [result] = await pool.execute(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ Order นี้'
      })
    }

    res.json({
      success: true,
      message: 'อัปเดตสถานะสำเร็จ'
    })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'
    })
  }
})

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
