const db = require("../config/db");

// GET /api/admin/stats - ดูสถิติสำหรับ Dashboard
const getStats = async (req, res) => {
  try {
    // นับจำนวนสินค้าทั้งหมด
    const [[{ totalProducts }]] = await db.query(
      "SELECT COUNT(*) AS totalProducts FROM products"
    );

    // นับจำนวนออเดอร์ทั้งหมด
    const [[{ totalOrders }]] = await db.query(
      "SELECT COUNT(*) AS totalOrders FROM orders"
    );

    // คำนวณรายได้รวม
    const [[{ totalRevenue }]] = await db.query(
      "SELECT COALESCE(SUM(total_price), 0) AS totalRevenue FROM orders WHERE status != 'cancelled'"
    );

    // นับออเดอร์ตามสถานะ
    const [statusCounts] = await db.query(
      `SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM orders`
    );

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalRevenue,
        ordersByStatus: statusCounts[0],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats };
