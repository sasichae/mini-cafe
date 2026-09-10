const db = require("../config/db");

// GET /api/products - ดูสินค้าทั้งหมด
const getProducts = async (req, res) => {
  try {
    const [products] = await db.query("SELECT * FROM products ORDER BY id DESC");
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id - ดูรายละเอียดสินค้า
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    res.status(200).json({ success: true, data: products[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products - เพิ่มสินค้า
const createProduct = async (req, res) => {
  try {
    const { name, description, price, image } = req.body;
    
    // Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!price || price <= 0) {
      return res.status(400).json({ success: false, message: "Price must be greater than 0" });
    }
    
    const [result] = await db.query(
      "INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)",
      [name, description || null, price, image || null]
    );
    
    res.status(201).json({ 
      success: true, 
      message: "Product created successfully",
      data: { id: result.insertId, name, description, price, image }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id - แก้ไขสินค้า
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image } = req.body;
    
    // Validation
    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ success: false, message: "Name cannot be empty" });
    }
    if (price !== undefined && price <= 0) {
      return res.status(400).json({ success: false, message: "Price must be greater than 0" });
    }
    
    // Check if product exists
    const [existing] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push("name = ?"); values.push(name); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    if (price !== undefined) { updates.push("price = ?"); values.push(price); }
    if (image !== undefined) { updates.push("image = ?"); values.push(image); }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }
    
    values.push(id);
    await db.query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, values);
    
    res.status(200).json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id - ลบสินค้า
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const [existing] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    await db.query("DELETE FROM products WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
