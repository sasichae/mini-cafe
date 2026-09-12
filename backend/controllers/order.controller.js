const db = require("../config/db");

async function generateOrderNumber(connection) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `ORD-${dateStr}-`;

  const [[{ lastNum }]] = await connection.query(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, ?) AS UNSIGNED)), 0) AS lastNum FROM orders WHERE order_number LIKE ?",
    [prefix.length + 1, `${prefix}%`]
  );

  const nextNum = (lastNum || 0) + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

const MAX_RETRIES = 3;

const createOrder = async (req, res) => {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { customer_name, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" });
      }

      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "รายการสินค้าไม่ถูกต้อง" });
        }
      }

      const productIds = items.map((item) => item.product_id);
      const [products] = await connection.query("SELECT id, price FROM products WHERE id IN (?)", [productIds]);

      if (products.length !== items.length) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "มีสินค้าบางรายการที่ไม่มีในระบบ" });
      }

      const priceMap = {};
      products.forEach((p) => { priceMap[p.id] = p.price; });

      let totalPrice = 0;
      const orderItems = items.map((item) => {
        const price = priceMap[item.product_id];
        totalPrice += price * item.quantity;
        return { product_id: item.product_id, quantity: item.quantity, price };
      });

      const orderNumber = await generateOrderNumber(connection);

      const [orderResult] = await connection.query(
        "INSERT INTO orders (order_number, customer_name, total_price, status, created_by) VALUES (?, ?, ?, 'pending', ?)",
        [orderNumber, customer_name || null, totalPrice, req.user.id]
      );
      const orderId = orderResult.insertId;

      const orderItemsValues = orderItems.map((item) => [orderId, item.product_id, item.quantity, item.price]);
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
        [orderItemsValues]
      );

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: "สร้างออเดอร์สำเร็จ",
        data: {
          id: orderId,
          order_number: orderNumber,
          customer_name: customer_name || null,
          total_price: totalPrice,
          status: "pending",
          items: orderItems,
        },
      });
    } catch (error) {
      await connection.rollback();
      const isDupEntry = error.code === "ER_DUP_ENTRY" || (error.errno && error.errno === 1062);
      if (isDupEntry && attempt < MAX_RETRIES - 1) {
        continue;
      }
      return res.status(500).json({ success: false, message: error.message });
    } finally {
      connection.release();
    }
  }
};

const getOrders = async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 20 } = req.query;

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
    const where = ["1=1"];
    const params = [];

    if (status && validStatuses.includes(status)) {
      where.push("status = ?");
      params.push(status);
    }

    if (from) {
      where.push("created_at >= ?");
      params.push(from);
    }

    if (to) {
      where.push("created_at <= ?");
      params.push(to);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const [orders] = await db.query(
      `SELECT o.*, u.username AS created_by_name
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       WHERE ${where.join(" AND ")}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM orders WHERE ${where.join(" AND ")}`,
      params
    );

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT o.*, u.username AS created_by_name
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบออเดอร์" });
    }

    const order = orders[0];

    const [items] = await db.query(
      `SELECT oi.id, oi.product_id, p.name AS product_name, oi.quantity, oi.price, (oi.price * oi.quantity) AS item_total
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.status(200).json({ success: true, data: { ...order, items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `สถานะต้องเป็นหนึ่งใน: ${validStatuses.join(", ")}`,
      });
    }

    const [existing] = await db.query("SELECT id FROM orders WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบออเดอร์" });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    res.status(200).json({
      success: true,
      message: "อัพเดทสถานะสำเร็จ",
      data: { id: parseInt(id), status },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT id FROM orders WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบออเดอร์" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query("DELETE FROM order_items WHERE order_id = ?", [id]);
      await connection.query("DELETE FROM orders WHERE id = ?", [id]);
      await connection.commit();

      res.status(200).json({ success: true, message: "ลบออเดอร์สำเร็จ" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, deleteOrder };
