import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, createOrder } from "../services/api";
import Loading from "../components/Loading";

export default function StaffOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getProducts({ limit: 100 });
        if (!cancelled) setProducts(result.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleSubmit() {
    if (cart.length === 0) {
      setError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const items = cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));
      const result = await createOrder(customerName, items);
      navigate("/admin/order-success", { state: result });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="staff-order-page">
      <h1 className="page-title">สร้างออเดอร์ใหม่</h1>

      {error && (
        <div className="admin-error">
          {error}
          <button onClick={() => setError(null)}>ปิด</button>
        </div>
      )}

      <div className="staff-order-layout">
        <div className="staff-product-list">
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="staff-product-grid">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                className="staff-product-card"
                onClick={() => addToCart(product)}
              >
                {product.image && (
                  <img src={product.image} alt={product.name} className="staff-product-img" />
                )}
                <span className="staff-product-name">{product.name}</span>
                <span className="staff-product-price">฿{Number(product.price).toLocaleString()}</span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="empty-message">ไม่พบสินค้า</p>
            )}
          </div>
        </div>

        <div className="staff-cart">
          <h2>ออเดอร์ปัจจุบัน</h2>

          <div className="staff-cart-field">
            <label htmlFor="customerName">ชื่อลูกค้า (ไม่บังคับ)</label>
            <input
              id="customerName"
              type="text"
              className="search-input"
              placeholder="กรอกชื่อลูกค้า..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {cart.length === 0 ? (
            <p className="empty-message">ยังไม่มีสินค้าในออเดอร์</p>
          ) : (
            <>
              <div className="staff-cart-items">
                {cart.map((item) => (
                  <div key={item.product_id} className="staff-cart-item">
                    <div className="staff-cart-item-info">
                      <span className="staff-cart-item-name">{item.name}</span>
                      <span className="staff-cart-item-price">฿{Number(item.price).toLocaleString()}</span>
                    </div>
                    <div className="staff-cart-item-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="staff-cart-total">
                <span>ราคารวม</span>
                <span className="total-value">฿{totalPrice.toLocaleString()}</span>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "กำลังสร้างออเดอร์..." : "สร้างออเดอร์"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
