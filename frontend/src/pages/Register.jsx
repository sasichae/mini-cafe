import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import '../styles/Login.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password || !confirmPassword) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <section className="login-panel">
          <div className="login-form">
            <h2 className="login-title">สมัครสมาชิกสำเร็จ</h2>
            <p className="login-subtitle">You can now sign in</p>
            <button
              type="button"
              className="login-button"
              onClick={() => navigate('/login')}
            >
              กลับไปเข้าสู่ระบบ
            </button>
          </div>
        </section>
      </div>
    )
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
          <h2 className="login-title">สมัครสมาชิก</h2>
          <p className="login-subtitle">Create an account</p>

          <div className="field">
            <label htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
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
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
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
            Register
          </button>
        </form>

        <p className="login-hint">
          มีบัญชีอยู่แล้ว?{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/login')}
          >
            เข้าสู่ระบบ
          </button>
        </p>
      </section>
    </div>
  )
}
