import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message)
        setLoading(false)
        return
      }

      localStorage.setItem('mini-cafe-token', data.token)
      onLogin(data.user)
      navigate(data.user.role === 'admin' ? '/admin' : '/')
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-brand" aria-label="Mini Cafe">
        <svg className="brand-cup" viewBox="0 0 64 64" role="img" aria-hidden="true">
          <path
            className="cup-body"
            d="M14 27h32v12a12 12 0 0 1-12 12H26a12 12 0 0 1-12-12V27Z"
          />
          <path
            className="cup-handle"
            d="M46 31h3a6 6 0 0 1 0 12h-7"
          />
          <path className="cup-saucer" d="M12 53h36" />
          <path className="steam" d="M24 16c-2 3 2 5 0 8" />
          <path className="steam" d="M34 14c-2 3 2 5 0 8" />
        </svg>
        <p className="brand-kicker">MINI CAFE</p>
        <h1 className="brand-name">Mini Cafe</h1>
        <p className="brand-tagline">กาแฟอร่อยดีต่อใจ ทุกแก้วที่เสิร์ฟด้วยรอยยิ้ม</p>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h2 className="login-title">เข้าสู่ระบบ</h2>
          <p className="login-subtitle">Sign in to continue</p>

          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="กรอกชื่อผู้ใช้"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setError('')
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm0 9.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" />
              </svg>
              {error}
            </p>
          )}

          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        <p className="login-hint">
          ทดลองใช้:{' '}
          <code>staff / staff123</code> หรือ <code>admin / admin123</code>
        </p>
        <p className="login-hint">
          ยังไม่มีบัญชี?{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/register')}
          >
            สมัครสมาชิก
          </button>
        </p>
      </section>
    </div>
  )
}