const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "mini-cafe-secret-key";

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
    }

    if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({ success: false, message: "ชื่อผู้ใช้ต้องมี 3-30 ตัวอักษร" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return res.status(400).json({ success: false, message: "ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร ตัวเลข และ _ เท่านั้น" });
    }

    if (typeof email !== "string" || email.trim().length > 100) {
      return res.status(400).json({ success: false, message: "อีเมลต้องไม่เกิน 100 ตัวอักษร" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    if (typeof password !== "string" || password.length < 6 || password.length > 100) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมี 6-100 ตัวอักษร" });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้แล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'staff')",
      [username, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, username, email, role: "staff" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
      data: { token, user: { id: result.insertId, username, email, role: "staff" } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
    }

    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }

    res.status(200).json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe };
