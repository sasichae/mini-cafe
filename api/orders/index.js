const { getPool } = require('../_lib/db')
const { authenticate } = require('../_lib/middleware')
const { setCorsHeaders } = require('../_lib/cors')

module.exports = async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const user = authenticate(req, res)
  if (!user) return

  if (req.method === 'GET') {
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' })
    }

    try {
      const pool = getPool()
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
      let paramIndex = 1

      if (status && validStatuses.includes(status)) {
        sql += ` WHERE o.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      sql += ' ORDER BY o.created_at DESC'

      const result = await pool.query(sql, params)

      const orderMap = new Map()
      for (const row of result.rows) {
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

      res.json({ success: true, data: Array.from(orderMap.values()) })
    } catch (error) {
      console.error('Get orders error:', error)
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
    }
  } else if (req.method === 'POST') {
    const { items } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' })
    }

    const client = await getPool().connect()

    try {
      await client.query('BEGIN')

      let totalAmount = 0
      const productIds = items.map(item => item.product_id)
      const productsResult = await client.query(
        `SELECT product_id, price, is_available FROM products WHERE product_id = ANY($1)`,
        [productIds]
      )

      const productMap = {}
      for (const product of productsResult.rows) {
        productMap[product.product_id] = product
      }

      const validatedItems = []
      for (const item of items) {
        const product = productMap[item.product_id]

        if (!product) {
          await client.query('ROLLBACK')
          client.release()
          return res.status(400).json({ success: false, message: `ไม่พบสินค้า ID ${item.product_id}` })
        }

        if (!product.is_available) {
          await client.query('ROLLBACK')
          client.release()
          return res.status(400).json({ success: false, message: `สินค้า ${item.product_id} ไม่พร้อมขาย` })
        }

        if (!item.quantity || item.quantity < 1) {
          await client.query('ROLLBACK')
          client.release()
          return res.status(400).json({ success: false, message: 'จำนวนสินค้าต้องมากกว่า 0' })
        }

        const unitPrice = parseFloat(product.price)
        const total = unitPrice * item.quantity
        totalAmount += total

        validatedItems.push({ product_id: item.product_id, quantity: item.quantity, unit_price: unitPrice, total })
      }

      const orderResult = await client.query(
        'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING order_id',
        [user.id, totalAmount, 'pending']
      )

      const orderId = orderResult.rows[0].order_id

      for (const item of validatedItems) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5)',
          [orderId, item.product_id, item.quantity, item.unit_price, item.total]
        )
      }

      await client.query('COMMIT')
      client.release()

      res.json({
        success: true,
        message: 'สร้าง Order สำเร็จ',
        data: { order_id: orderId, total_amount: totalAmount, status: 'pending', items: validatedItems }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      client.release()
      console.error('Create order error:', error)
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
