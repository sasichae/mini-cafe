import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, getActiveOrders, updateOrderStatus } from "../services/api";
import Loading from "../components/Loading";

const STATUS_LABELS = {
  pending: "รอรับออเดอร์",
  preparing: "กำลังทำ",
  ready: "พร้อมเสิร์ฟ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const STATUS_NEXT = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [statsData, ordersData] = await Promise.all([
          getAdminStats(),
          getActiveOrders(),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setActiveOrders(ordersData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function handleAdvanceStatus(id, currentStatus) {
    const nextStatus = STATUS_NEXT[currentStatus];
    if (!nextStatus) return;
    try {
      await updateOrderStatus(id, nextStatus);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loading />;
  if (error) return <div className="error-container"><p className="error-message">{error}</p></div>;

  return (
    <div className="admin-page">
      <h1 className="page-title">Admin Dashboard</h1>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-label">สินค้าทั้งหมด</span>
          <span className="stat-value">{stats.totalProducts}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">ออเดอร์ทั้งหมด</span>
          <span className="stat-value">{stats.totalOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">รายได้รวม</span>
          <span className="stat-value">฿{Number(stats.totalRevenue).toLocaleString()}</span>
        </div>
      </div>

      <div className="admin-status-section">
        <h2>สถานะออเดอร์</h2>
        <div className="admin-status-grid">
          <div className="status-card status-pending">
            <span className="stat-label">รอรับออเดอร์</span>
            <span className="stat-value">{stats.ordersByStatus.pending || 0}</span>
          </div>
          <div className="status-card status-preparing">
            <span className="stat-label">กำลังทำ</span>
            <span className="stat-value">{stats.ordersByStatus.preparing || 0}</span>
          </div>
          <div className="status-card status-ready">
            <span className="stat-label">พร้อมเสิร์ฟ</span>
            <span className="stat-value">{stats.ordersByStatus.ready || 0}</span>
          </div>
          <div className="status-card status-completed">
            <span className="stat-label">เสร็จสิ้น</span>
            <span className="stat-value">{stats.ordersByStatus.completed || 0}</span>
          </div>
          <div className="status-card status-cancelled">
            <span className="stat-label">ยกเลิก</span>
            <span className="stat-value">{stats.ordersByStatus.cancelled || 0}</span>
          </div>
        </div>
      </div>

      <div className="admin-active-section">
        <h2>ออเดอร์ที่กำลังทำ ({activeOrders.length})</h2>
        {activeOrders.length === 0 ? (
          <p className="empty-message">ไม่มีออเดอร์ที่กำลังทำ</p>
        ) : (
          <div className="active-orders-grid">
            {activeOrders.map((order) => (
              <div key={order.id} className={`active-order-card status-bg-${order.status}`}>
                <div className="active-order-header">
                  <span className="active-order-number">{order.order_number}</span>
                  <span className={`status-badge status-${order.status}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                {order.customer_name && (
                  <p className="active-order-customer">ลูกค้า: {order.customer_name}</p>
                )}
                <p className="active-order-total">฿{Number(order.total_price).toLocaleString()}</p>
                <p className="active-order-time">
                  {new Date(order.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleAdvanceStatus(order.id, order.status)}
                >
                  {STATUS_NEXT[order.status] === "preparing" && "เริ่มทำ"}
                  {STATUS_NEXT[order.status] === "ready" && "เสร็จ พร้อมเสิร์ฟ"}
                  {STATUS_NEXT[order.status] === "completed" && "เสร็จสิ้น"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-actions">
        <Link to="/admin/staff-order" className="btn btn-primary">
          + สร้างออเดอร์ใหม่
        </Link>
        <Link to="/admin/products" className="btn btn-secondary">
          จัดการสินค้า
        </Link>
        <Link to="/admin/orders" className="btn btn-secondary">
          ดูออเดอร์ทั้งหมด
        </Link>
      </div>
    </div>
  );
}
