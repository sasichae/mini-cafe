const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

// GET /api/products - ดูสินค้าทั้งหมด
router.get("/", getProducts);

// GET /api/products/:id - ดูรายละเอียดสินค้า
router.get("/:id", getProductById);

// POST /api/products - เพิ่มสินค้า
router.post("/", createProduct);

// PUT /api/products/:id - แก้ไขสินค้า
router.put("/:id", updateProduct);

// DELETE /api/products/:id - ลบสินค้า
router.delete("/:id", deleteProduct);

module.exports = router;
