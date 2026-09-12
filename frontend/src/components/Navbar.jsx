import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { getItemCount } = useCart();
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
          คำสั่งซื้อ
        </Link>
        <Link to="/cart" className="nav-link cart-link">
          ตะกร้า
          {count > 0 && <span className="cart-badge">{count}</span>}
        </Link>
        <Link to="/admin" className="nav-link nav-admin">
          Admin
        </Link>
      </div>
    </nav>
  );
}
