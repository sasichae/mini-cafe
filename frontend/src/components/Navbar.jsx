import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { getItemCount } = useCart();
  const { user, logout } = useAuth();
  const count = getItemCount();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Mini Café
      </Link>
      <div className="navbar-links">
        <Link to="/" className="nav-link">
          เมนู
        </Link>
        <Link to="/orders" className="nav-link">
          ออเดอร์
        </Link>
        <Link to="/cart" className="nav-link cart-link">
          ตะกร้า
          {count > 0 && <span className="cart-badge">{count}</span>}
        </Link>
        {user ? (
          <>
            <Link to="/admin/staff-order" className="nav-link nav-admin">
              สั่งออเดอร์
            </Link>
            <Link to="/admin" className="nav-link nav-admin">
              Admin
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
