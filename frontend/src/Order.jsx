export default function Order({ user, onLogout }) {
  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-brand">
          <p className="topbar-kicker">MINI CAFE</p>
          <h1 className="topbar-title">Order</h1>
        </div>
        <div className="topbar-actions">
          <span className="role-chip">Staff</span>
          <button type="button" className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-main">
        <div className="placeholder-card">
          <h2>หน้ารับออเดอร์</h2>
          <p>ระบบสั่งซื้อเมนูกำลังจะมาเร็วๆ นี้</p>
          <p className="placeholder-note">สวัสดีครับ {user.name}</p>
        </div>
      </main>
    </div>
  )
}