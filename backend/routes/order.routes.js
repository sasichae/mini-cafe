const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
} = require("../controllers/order.controller");

// POST /api/orders - สร้างออเดอร์
router.post("/", createOrder);

// GET /api/orders - ดูออเดอร์ทั้งหมด
router.get("/", getOrders);

// GET /api/orders/:id - ดูรายละเอียดออเดอร์
router.get("/:id", getOrderById);

module.exports = router;