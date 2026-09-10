import { Link, useLocation } from "react-router-dom";

export default function OrderSuccess() {
  const location = useLocation();
  const orderData = location.state;

  if (!orderData) {
    return (
      <div className="order-success">
        <div className="order-success-content">
          <p>ไม่พบข้อมูลคำสั่งซื้อ</p>
          <Link to="/" className="btn btn-primary">
            กลับไปที่เมนู
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success">
      <div className="order-success-content">
        <div className="success-icon">✓</div>
        <h1>สั่งซื้อสำเร็จ!</h1>
        <div className="order-details">
          <p>
            <strong>Order ID:</strong> #{orderData.id}
          </p>
          <p>
            <strong>Total:</strong> ฿{parseFloat(orderData.total_price).toFixed(0)}
          </p>
          <p>
            <strong>Status:</strong> {orderData.status}
          </p>
        </div>
        <Link to="/" className="btn btn-primary">
          กลับไปที่เมนู
        </Link>
      </div>
    </div>
  );
}
