import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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
            <label>ชื่อผู้ใช้ (3-30 ตัวอักษร, a-z, 0-9, _)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              required
            />
          </div>
          <div className="form-group">
            <label>อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div className="form-group">
            <label>รหัสผ่าน (6-100 ตัวอักษร)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              maxLength={100}
              required
            />
          </div>
          <div className="form-group">
            <label>ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              maxLength={100}
              required
            />
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
