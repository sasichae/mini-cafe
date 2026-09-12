const express = require("express");
const router = express.Router();
const { authMiddleware, staffOrAdmin } = require("../middleware/auth");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/order.controller");

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, staffOrAdmin, getOrders);
router.get("/:id", authMiddleware, staffOrAdmin, getOrderById);
router.put("/:id/status", authMiddleware, staffOrAdmin, updateOrderStatus);
router.delete("/:id", authMiddleware, staffOrAdmin, deleteOrder);

module.exports = router;
