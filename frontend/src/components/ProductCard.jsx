import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `http://localhost:3000/images/${product.image}`
    : null;

  return (
    <div className="product-card">
      <div className="product-image">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} />
        ) : (
          <div className="product-image-placeholder">☕</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">฿{parseFloat(product.price).toFixed(0)}</p>
        <button
          className="btn btn-primary"
          onClick={() => addToCart(product)}
        >
          เพิ่มลงตะกร้า
        </button>
      </div>
    </div>
  );
}
