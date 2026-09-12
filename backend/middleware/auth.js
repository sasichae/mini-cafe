const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'mini-cafe-secret-key'

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'กรุณาเข้าสู่ระบบ'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้องหรือหมดอายุ'
    })
  }
}

module.exports = { authenticate, JWT_SECRET }
