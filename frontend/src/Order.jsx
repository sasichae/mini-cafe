import { useState, useEffect } from 'react'
import { apiFetch } from './api'

export default function Order({ user, onLogout }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory)
    } else {
      fetchProducts()
    }
  }, [selectedCategory])

  async function fetchCategories() {
    try {
      const res = await apiFetch('/api/categories')
      const data = await res.json()
      if (data.success) setCategories(data.data)
    } catch (error) {
      console.error('Fetch categories error:', error)
    }
  }

  async function fetchProducts(categoryId = null) {
    try {
      setLoading(true)
      const url = categoryId
        ? `/api/products?category_id=${categoryId}`
        : '/api/products'
      const res = await apiFetch(url)
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch (error) {
      console.error('Fetch products error:', error)
    } finally {
      setLoading(false)
    }
  }

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id)
      if (existing) {
        return prev.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(item => item.product_id !== productId))
  }

  function updateQuantity(productId, delta) {
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : item
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  function getTotalAmount() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  async function placeOrder() {
    if (cart.length === 0 || orderLoading) return

    setOrderLoading(true)
    setOrderError('')

    try {
      const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))

      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })

      const data = await res.json()

      if (!data.success) {
        setOrderError(data.message)
        setOrderLoading(false)
        return
      }

      setOrderSuccess(data.data)
      setCart([])
    } catch {
      setOrderError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      setOrderLoading(false)
    }
  }

  function newOrder() {
    setOrderSuccess(null)
    setOrderError('')
  }

  if (orderSuccess) {
    return (
      <div className="page">
        <header className="topbar">
          <div className="topbar-brand">
            <p className="topbar-kicker">MINI CAFE</p>
            <h1 className="topbar-title">Staff Order</h1>
          </div>
          <div className="topbar-actions">
            <span className="role-chip">{user.username}</span>
            <button type="button" className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="order-layout">
          <section className="order-success">
            <div className="success-icon">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M20 32l8 8 16-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="success-title">สั่งซื้อสำเร็จ!</h2>
            <p className="success-order-id">Order #{orderSuccess.order_id}</p>
            <p className="success-total">ยอดรวม ฿{Number(orderSuccess.total_amount).toFixed(2)}</p>
            <p className="success-status">สถานะ: pending</p>
            <button
              type="button"
              className="success-button"
              onClick={newOrder}
            >
              สั่งซื้อใหม่
            </button>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-brand">
          <p className="topbar-kicker">MINI CAFE</p>
          <h1 className="topbar-title">Staff Order</h1>
        </div>
        <div className="topbar-actions">
          <span className="role-chip">{user.username}</span>
          <button type="button" className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="order-layout">
        <section className="menu-section">
          <div className="category-tabs">
            <button
              type="button"
              className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.category_id}
                type="button"
                className={`category-tab ${selectedCategory === cat.category_id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.category_id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : products.length === 0 ? (
              <p className="empty-text">ไม่มีสินค้า</p>
            ) : (
              products.map(product => (
                <div key={product.product_id} className="product-card">
                  {product.image && (
                    <img
                      className="product-image"
                      src={product.image}
                      alt={product.name}
                    />
                  )}
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-desc">{product.description}</p>
                    <p className="product-price">฿{Number(product.price).toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    className="add-button"
                    onClick={() => addToCart(product)}
                  >
                    + Add
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="cart-section">
          <h2 className="cart-title">Order Summary</h2>

          {cart.length === 0 ? (
            <p className="empty-cart">ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.product_id} className="cart-item">
                    <div className="cart-item-info">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">฿{Number(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        type="button"
                        className="qty-button"
                        onClick={() => updateQuantity(item.product_id, -1)}
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-button"
                        onClick={() => updateQuantity(item.product_id, 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span className="total-price">฿{Number(getTotalAmount()).toFixed(2)}</span>
                </div>
                {orderError && (
                  <p className="order-error" role="alert">{orderError}</p>
                )}
                <button
                  type="button"
                  className="checkout-button"
                  disabled={orderLoading}
                  onClick={placeOrder}
                >
                  {orderLoading ? 'กำลังสั่งซื้อ...' : 'Place Order'}
                </button>
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  )
}
