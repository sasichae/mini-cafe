const express = require("express");
const router = express.Router();
const { getStats, getActiveOrders } = require("../controllers/admin.controller");

router.get("/stats", getStats);
router.get("/active-orders", getActiveOrders);

module.exports = router;
