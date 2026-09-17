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
    try {
      const pool = getPool()
      const { category_id, show_all } = req.query

      let query = 'SELECT * FROM products'
      const params = []
      const conditions = []
      let paramIndex = 1

      if (user.role !== 'admin' || show_all !== 'true') {
        conditions.push('is_available = true')
      }

      if (category_id) {
        conditions.push(`category_id = $${paramIndex}`)
        params.push(category_id)
        paramIndex++
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }

      query += ' ORDER BY product_id'

      const result = await pool.query(query, params)
      res.json({ success: true, data: result.rows })
    } catch (error) {
      console.error('Get products error:', error)
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
    }
  } else if (req.method === 'POST') {
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' })
    }

    const { name, price, category_id, description, image } = req.body

    if (!name || !price || !category_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อสินค้า, ราคา, และหมวดหมู่' })
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'ราคาต้องมากกว่า 0' })
    }

    try {
      const pool = getPool()
      const result = await pool.query(
        'INSERT INTO products (name, price, category_id, description, image) VALUES ($1, $2, $3, $4, $5) RETURNING product_id',
        [name, parsedPrice, parseInt(category_id), description || null, image || null]
      )

      res.json({ success: true, message: 'เพิ่มสินค้าสำเร็จ', data: { product_id: result.rows[0].product_id } })
    } catch (error) {
      console.error('Create product error:', error)
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
