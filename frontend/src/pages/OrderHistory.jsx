import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../services/api";
import Loading from "../components/Loading";

const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  processing: "กำลังเตรียม",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const params = { limit: 10 };
        if (statusFilter) params.status = statusFilter;
        const result = await getOrders(params);
        setOrders(result.data);
        setPagination(result.pagination);
      } catch (err) {
        setError(err.message || "ไม่สามารถโหลดประวัติคำสั่งซื้อได้");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [statusFilter]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <h1 className="page-title">ประวัติคำสั่งซื้อ</h1>

      <div className="filter-bar">
        <select
          className="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">ทุกสถานะ</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="processing">กำลังเตรียม</option>
          <option value="completed">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="empty-message">ยังไม่มีคำสั่งซื้อ</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <Link
              to={`/orders/${order.id}`}
              key={order.id}
              className="order-card"
            >
              <div className="order-header">
                <span className="order-id">คำสั่งซื้อ #{order.id}</span>
                <span className={`order-status status-${order.status}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="order-info">
                <span className="order-total">
                  ฿{parseFloat(order.total_price).toFixed(2)}
                </span>
                <span className="order-date">
                  {new Date(order.created_at).toLocaleDateString("th-TH")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <span className="page-info">
            หน้า {pagination.page} จาก {pagination.totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
