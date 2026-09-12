const express = require("express");
const multer = require("multer");
const path = require("path");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("ไฟล์ต้องเป็นรูปภาพ (JPEG, PNG, WebP, GIF)"), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/", authMiddleware, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "ไม่พบไฟล์รูปภาพ" });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, data: { url: imageUrl } });
});

module.exports = router;
