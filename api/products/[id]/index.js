const { getPool } = require('../../../_lib/db')
const { authenticate } = require('../../../_lib/middleware')
const { setCorsHeaders } = require('../../../_lib/cors')

module.exports = async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const user = authenticate(req, res)
  if (!user) return

  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const pool = getPool()
      const result = await pool.query('SELECT * FROM products WHERE product_id = $1', [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' })
      }

      res.json({ success: true, data: result.rows[0] })
    } catch (error) {
      console.error('Get product error:', error)
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
    }
  } else if (req.method === 'PUT') {
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
        'UPDATE products SET name = $1, price = $2, category_id = $3, description = $4, image = $5 WHERE product_id = $6',
        [name, parsedPrice, parseInt(category_id), description || null, image || null, id]
      )

      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' })
      }

      res.json({ success: true, message: 'แก้ไขสินค้าสำเร็จ' })
    } catch (error) {
      console.error('Update product error:', error)
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
    }
  } else if (req.method === 'DELETE') {
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' })
    }

    try {
      const pool = getPool()
      const existing = await pool.query('SELECT product_id FROM products WHERE product_id = $1', [id])

      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'ไม่พบสินค้า' })
      }

      const orders = await pool.query('SELECT COUNT(*) AS cnt FROM order_items WHERE product_id = $1', [id])

      if (parseInt(orders.rows[0].cnt) > 0) {
        return res.status(400).json({ success: false, message: 'ไม่สามารถลบสินค้าได้ เนื่องจากมีรายการสั่งซื้อที่เกี่ยวข้อง' })
      }

      await pool.query('DELETE FROM products WHERE product_id = $1', [id])
      res.json({ success: true, message: 'ลบสินค้าสำเร็จ' })
    } catch (error) {
      console.error('Delete product error:', error)
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
