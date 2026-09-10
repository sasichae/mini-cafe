import { useCart } from "../context/CartContext";

export default function CartItem({ item }) {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  const itemTotal = parseFloat(item.price) * item.quantity;

  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <h3 className="cart-item-name">{item.name}</h3>
        <p className="cart-item-price">฿{parseFloat(item.price).toFixed(0)} / ชิ้น</p>
      </div>
      <div className="cart-item-controls">
        <button
          className="btn btn-quantity"
          onClick={() => decreaseQuantity(item.id)}
          disabled={item.quantity <= 1}
        >
          -
        </button>
        <span className="cart-item-quantity">{item.quantity}</span>
        <button
          className="btn btn-quantity"
          onClick={() => increaseQuantity(item.id)}
        >
          +
        </button>
      </div>
      <div className="cart-item-total">
        <p>รวม ฿{itemTotal.toFixed(0)}</p>
      </div>
      <button
        className="btn btn-danger"
        onClick={() => removeFromCart(item.id)}
      >
        ลบ
      </button>
    </div>
  );
}
