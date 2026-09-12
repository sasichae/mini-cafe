const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/admin.controller");

// GET /api/admin/stats - ดูสถิติสำหรับ Dashboard
router.get("/stats", getStats);

module.exports = router;
