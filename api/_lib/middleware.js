const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

function authenticate(req, res) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' })
    return null
  }

  const token = authHeader.split(' ')[1]

  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    res.status(401).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' })
    return null
  }
}

function authorize(user, res, ...roles) {
  if (!roles.includes(user.role)) {
    res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' })
    return false
  }
  return true
}

module.exports = { authenticate, authorize }
