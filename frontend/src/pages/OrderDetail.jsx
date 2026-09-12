import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../services/api";
import Loading from "../components/Loading";

const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  processing: "กำลังเตรียม",
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
        setError(err.message || "ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้");
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
          กลับไปหน้าคำสั่งซื้อ
        </Link>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="order-detail-page">
      <Link to="/orders" className="back-link">
        ← กลับไปหน้าคำสั่งซื้อ
      </Link>

      <h1 className="page-title">คำสั่งซื้อ #{order.id}</h1>

      <div className="order-detail-card">
        <div className="order-detail-header">
          <span className={`order-status status-${order.status}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
          <span className="order-date">
            {new Date(order.created_at).toLocaleString("th-TH")}
          </span>
        </div>

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
                    <td>฿{parseFloat(item.price).toFixed(2)}</td>
                    <td>฿{parseFloat(item.item_total).toFixed(2)}</td>
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
            ฿{parseFloat(order.total_price).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
