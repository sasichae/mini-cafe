const db = require("../config/db");

const getStats = async (req, res) => {
  try {
    const [[{ totalProducts }]] = await db.query("SELECT COUNT(*) AS totalProducts FROM products");
    const [[{ totalOrders }]] = await db.query("SELECT COUNT(*) AS totalOrders FROM orders");
    const [[{ totalRevenue }]] = await db.query(
      "SELECT COALESCE(SUM(total_price), 0) AS totalRevenue FROM orders WHERE status != 'cancelled'"
    );

    const [statusCounts] = await db.query(
      `SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) AS preparing,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) AS ready,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM orders`
    );

    res.status(200).json({
      success: true,
      data: { totalProducts, totalOrders, totalRevenue, ordersByStatus: statusCounts[0] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getActiveOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.username AS created_by_name
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.status IN ('pending', 'preparing', 'ready')
       ORDER BY FIELD(o.status, 'ready', 'preparing', 'pending'), o.created_at ASC`
    );

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getActiveOrders };
