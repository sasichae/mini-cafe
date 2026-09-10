import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/api";
import CartItem from "../components/CartItem";
import Loading from "../components/Loading";

export default function Cart() {
  const { cart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalPrice = getTotalPrice();

  async function handleConfirmOrder() {
    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const items = cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      const orderData = await createOrder(items);
      clearCart();
      navigate("/order/success", { state: orderData });
    } catch (err) {
      setError(err.message || "ไม่สามารถสร้างคำสั่งซื้อได้");
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <p>ตะกร้ายังไม่มีสินค้า</p>
          <Link to="/" className="btn btn-primary">
            กลับไปที่เมนู
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="page-title">ตะกร้าสินค้า</h1>

      <div className="cart-items">
        {cart.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-total">
          <span>ราคารวม:</span>
          <span className="total-price">฿{totalPrice.toFixed(0)}</span>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button
          className="btn btn-primary btn-block"
          onClick={handleConfirmOrder}
          disabled={loading}
        >
          {loading ? "กำลังดำเนินการ..." : "ยืนยันคำสั่งซื้อ"}
        </button>
      </div>
    </div>
  );
}
