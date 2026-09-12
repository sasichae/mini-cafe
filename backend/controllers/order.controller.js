const db = require("../config/db");

// POST /api/orders - สร้างออเดอร์
const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    // Validation: items ต้องเป็น array และมีอย่างน้อย 1 รายการ
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Validation: ตรวจสอบแต่ละ item
    for (const item of items) {
      if (!item.product_id || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item must have product_id and quantity greater than 0",
        });
      }
    }

    // ดึงข้อมูลสินค้าจาก Database
    const productIds = items.map((item) => item.product_id);
    const [products] = await db.query(
      "SELECT id, price FROM products WHERE id IN (?)",
      [productIds]
    );

    // ตรวจสอบว่าสินค้ามีอยู่จริงทุกรายการ
    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products do not exist",
      });
    }

    // สร้าง map ของราคาสินค้า
    const priceMap = {};
    products.forEach((p) => {
      priceMap[p.id] = p.price;
    });

    // คำนวณราคารวม
    let totalPrice = 0;
    const orderItems = items.map((item) => {
      const price = priceMap[item.product_id];
      const itemTotal = price * item.quantity;
      totalPrice += itemTotal;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price: price,
      };
    });

    // ใช้ transaction เพื่อความปลอดภัย
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // บันทึกออเดอร์ลงตาราง orders
      const [orderResult] = await connection.query(
        "INSERT INTO orders (total_price, status) VALUES (?, 'pending')",
        [totalPrice]
      );
      const orderId = orderResult.insertId;

      // บันทึกรายการสินค้าลงตาราง order_items
      const orderItemsValues = orderItems.map((item) => [
        orderId,
        item.product_id,
        item.quantity,
        item.price,
      ]);

      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
        [orderItemsValues]
      );

      await connection.commit();

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          id: orderId,
          total_price: totalPrice,
          status: "pending",
          items: orderItems,
        },
      });
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

// GET /api/orders - ดูออเดอร์ทั้งหมด (พร้อม filter/pagination)
const getOrders = async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 20 } = req.query;

    const where = ["1=1"];
    const params = [];

    if (status && ["pending", "processing", "completed", "cancelled"].includes(status)) {
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
      `SELECT * FROM orders WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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

// GET /api/orders/:id - ดูรายละเอียดออเดอร์พร้อมรายการสินค้า
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // ดึงข้อมูลออเดอร์
    const [orders] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orders[0];

    // ดึงรายการสินค้าในออเดอร์ พร้อมชื่อสินค้า
    const [items] = await db.query(
      `SELECT 
        oi.id,
        oi.product_id,
        p.name as product_name,
        oi.quantity,
        oi.price,
        (oi.price * oi.quantity) as item_total
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...order,
        items: items,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/status - อัพเดทสถานะออเดอร์
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const [existing] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await db.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: { id: parseInt(id), status },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/orders/:id - ลบออเดอร์
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query("DELETE FROM order_items WHERE order_id = ?", [id]);
      await connection.query("DELETE FROM orders WHERE id = ?", [id]);
      await connection.commit();

      res.status(200).json({ success: true, message: "Order deleted successfully" });
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

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};