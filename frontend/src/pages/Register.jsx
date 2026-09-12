import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const USERNAME_RE = /^(?=.*[a-zA-Z])[a-zA-Z0-9_]+$/;

function validateUsername(value) {
  if (value.length === 0) return null;
  if (value.length < 3 || value.length > 30) return "ชื่อผู้ใช้ต้องมี 3-30 ตัวอักษร";
  if (!USERNAME_RE.test(value)) return "ชื่อผู้ใช้ต้องมีตัวอักษรอย่างน้อย 1 ตัว";
  return null;
}

function validateEmail(value) {
  if (value.length === 0) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "รูปแบบอีเมลไม่ถูกต้อง";
  return null;
}

function validatePassword(value) {
  if (value.length === 0) return null;
  if (value.length < 6) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
  return null;
}

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const usernameError = validateUsername(username);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const confirmError = confirmPassword.length > 0 && password !== confirmPassword ? "รหัสผ่านไม่ตรงกัน" : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setSaving(true);
    try {
      await register(username, email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="page-title">สมัครสมาชิก</h1>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ชื่อผู้ใช้</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {usernameError && <span className="field-error">{usernameError}</span>}
          </div>
          <div className="form-group">
            <label>อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {emailError && <span className="field-error">{emailError}</span>}
          </div>
          <div className="form-group">
            <label>รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {passwordError && <span className="field-error">{passwordError}</span>}
          </div>
          <div className="form-group">
            <label>ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmError && <span className="field-error">{confirmError}</span>}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
              {saving ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </div>
        </form>

        <p className="auth-link">
          มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
