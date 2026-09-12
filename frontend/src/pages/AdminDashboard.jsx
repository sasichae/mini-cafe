import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminStats } from "../services/api";
import Loading from "../components/Loading";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <span className="stat-label">คำสั่งซื้อทั้งหมด</span>
          <span className="stat-value">{stats.totalOrders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">รายได้รวม</span>
          <span className="stat-value">฿{Number(stats.totalRevenue).toLocaleString()}</span>
        </div>
      </div>

      <div className="admin-status-section">
        <h2>สถานะคำสั่งซื้อ</h2>
        <div className="admin-status-grid">
          <div className="status-card status-pending">
            <span className="stat-label">รอดำเนินการ</span>
            <span className="stat-value">{stats.ordersByStatus.pending || 0}</span>
          </div>
          <div className="status-card status-processing">
            <span className="stat-label">กำลังดำเนินการ</span>
            <span className="stat-value">{stats.ordersByStatus.processing || 0}</span>
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

      <div className="admin-actions">
        <Link to="/admin/products" className="btn btn-primary">
          จัดการสินค้า
        </Link>
        <Link to="/admin/orders" className="btn btn-secondary">
          จัดการคำสั่งซื้อ
        </Link>
      </div>
    </div>
  );
}
