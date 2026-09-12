import { Link, useLocation, useNavigate } from "react-router-dom";

export default function StaffOrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state;

  if (!orderData) {
    return (
      <div className="order-success">
        <div className="order-success-content">
          <p>ไม่พบข้อมูลออเดอร์</p>
          <Link to="/admin/staff-order" className="btn btn-primary">
            กลับไปสร้างออเดอร์
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success">
      <div className="order-success-content">
        <div className="success-icon">✓</div>
        <h1>สร้างออเดอร์สำเร็จ!</h1>

        <div className="order-number-display">
          <span className="order-number-label">หมายเลขออเดอร์</span>
          <span className="order-number-value">{orderData.order_number}</span>
        </div>

        {orderData.customer_name && (
          <p className="order-customer-name">ลูกค้า: {orderData.customer_name}</p>
        )}

        <div className="order-details">
          <p>
            <strong>ราคารวม:</strong> ฿{Number(orderData.total_price).toLocaleString()}
          </p>
          <p>
            <strong>สถานะ:</strong> รอรับออเดอร์
          </p>
        </div>

        <div className="order-success-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/admin/staff-order")}
          >
            สร้างออเดอร์ใหม่
          </button>
          <Link to="/admin" className="btn btn-secondary">
            กลับ Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
