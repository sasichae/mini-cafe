const express = require("express");
const router = express.Router();
const { authMiddleware, staffOrAdmin } = require("../middleware/auth");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", authMiddleware, staffOrAdmin, createProduct);
router.put("/:id", authMiddleware, staffOrAdmin, updateProduct);
router.delete("/:id", authMiddleware, staffOrAdmin, deleteProduct);

module.exports = router;
