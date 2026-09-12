import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/admin" className="navbar-brand">
        Mini Café
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/admin/staff-order" className="nav-link nav-admin">
              สั่งออเดอร์
            </Link>
            <Link to="/admin" className="nav-link nav-admin">
              Dashboard
            </Link>
            <Link to="/admin/products" className="nav-link nav-admin">
              สินค้า
            </Link>
            <Link to="/admin/orders" className="nav-link nav-admin">
              ออเดอร์
            </Link>
            <button className="nav-link nav-logout" onClick={logout}>
              ออกจากระบบ
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link">
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </nav>
  );
}
