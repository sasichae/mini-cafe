const express = require("express");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();

// Middleware สำหรับ parse JSON body
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

module.exports = app;