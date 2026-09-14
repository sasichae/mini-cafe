const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"')
}

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
