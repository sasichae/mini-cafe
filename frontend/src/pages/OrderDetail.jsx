import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../services/api";
import Loading from "../components/Loading";

const STATUS_LABELS = {
  pending: "รอรับออเดอร์",
  preparing: "กำลังทำ",
  ready: "พร้อมเสิร์ฟ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || "ไม่สามารถโหลดรายละเอียดออเดอร์ได้");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <Link to="/orders" className="btn btn-primary">
          กลับไปหน้าออเดอร์
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="order-detail-page">
      <Link to="/orders" className="back-link">
        ← กลับไปหน้าออเดอร์
      </Link>

      <h1 className="page-title">{order.order_number}</h1>

      <div className="order-detail-card">
        <div className="order-detail-header">
          <span className={`order-status status-${order.status}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
          <span className="order-date">
            {new Date(order.created_at).toLocaleString("th-TH")}
          </span>
        </div>

        {order.customer_name && (
          <p style={{ marginBottom: 16, color: "var(--text-light)" }}>
            ลูกค้า: {order.customer_name}
          </p>
        )}

        {order.created_by_name && (
          <p style={{ marginBottom: 16, color: "var(--text-light)" }}>
            สั่งโดย: {order.created_by_name}
          </p>
        )}

        <div className="order-items">
          <h3>รายการสินค้า</h3>
          {order.items && order.items.length > 0 ? (
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th>จำนวน</th>
                  <th>ราคา/หน่วย</th>
                  <th>รวม</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>฿{Number(item.price).toLocaleString()}</td>
                    <td>฿{Number(item.item_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-message">ไม่มีรายการสินค้า</p>
          )}
        </div>

        <div className="order-total-section">
          <span className="total-label">ราคารวมทั้งหมด</span>
          <span className="total-amount">
            ฿{Number(order.total_price).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
