export default function AdminDashboard({ user, onLogout }) {
  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-brand">
          <p className="topbar-kicker">MINI CAFE</p>
          <h1 className="topbar-title">Admin Dashboard</h1>
        </div>
        <div className="topbar-actions">
          <span className="role-chip role-chip-admin">Admin</span>
          <button type="button" className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-main">
        <div className="placeholder-card">
          <h2>แดชบอร์ดผู้ดูแลระบบ</h2>
          <p>รายงานยอดขาย สต็อก และการจัดการร้านจะแสดงที่นี่</p>
          <p className="placeholder-note">สวัสดีครับ {user.name}</p>
        </div>
      </main>
    </div>
  )
}