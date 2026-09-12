import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, updateOrderStatus, deleteOrder } from "../services/api";
import Loading from "../components/Loading";

const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  processing: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      try {
        const result = await getOrders(params);
        if (!cancelled) {
          setOrders(result.data);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [page, statusFilter, refreshKey]);

  async function handleStatusChange(id, newStatus) {
    try {
      await updateOrderStatus(id, newStatus);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบคำสั่งซื้อนี้?")) return;
    try {
      await deleteOrder(id);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="page-title">จัดการคำสั่งซื้อ</h1>
        <Link to="/admin" className="btn btn-secondary">
          กลับ Dashboard
        </Link>
      </div>

      {error && (
        <div className="admin-error">
          {error}
          <button onClick={() => setError(null)}>ปิด</button>
        </div>
      )}

      <div className="filter-bar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">ทุกสถานะ</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="processing">กำลังดำเนินการ</option>
          <option value="completed">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <p className="empty-message">ไม่มีคำสั่งซื้อ</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>วันที่</th>
                <th>ราคารวม</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/orders/${order.id}`}>#{order.id}</Link>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString("th-TH")}</td>
                  <td>฿{Number(order.total_price).toLocaleString()}</td>
                  <td>
                    <select
                      className={`status-select status-${order.status}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="table-actions">
                    <button
                      className="btn btn-small btn-delete"
                      onClick={() => handleDelete(order.id)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
          >
            ก่อนหน้า
          </button>
          <span className="page-info">
            หน้า {pagination.page} จาก {pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(pagination.page + 1)}
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
