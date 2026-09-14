import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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
      <div className="min-h-full flex flex-col bg-cream">
        <header className="flex items-center justify-between gap-4 px-7 py-4 border-b border-border bg-white">
          <div className="flex flex-col gap-0.5">
            <p className="m-0 text-[11px] font-bold tracking-[0.34em] text-caramel">MINI CAFE</p>
            <h1 className="m-0 font-display font-semibold text-2xl leading-tight text-espresso">Staff Order</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-cream-deep text-espresso text-[13px] font-bold">{user.username}</span>
            <button type="button" className="px-4 py-2 border-[1.5px] border-border rounded-lg bg-transparent text-mocha text-sm font-semibold cursor-pointer hover:border-error hover:text-error hover:bg-error-bg focus-visible:outline-3 focus-visible:outline-caramel focus-visible:outline-offset-2 transition-colors" onClick={onLogout} title="ออกจากระบบ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 grid grid-cols-[1fr_320px] gap-6 p-6 overflow-hidden">
          <section className="col-span-full flex flex-col items-center justify-center py-[60px] px-6 text-center">
            <div className="w-20 h-20 text-[#2d9d4e] mb-6">
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
                <path d="M20 32l8 8 16-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="m-0 mb-2 text-2xl font-bold text-espresso">สั่งซื้อสำเร็จ!</h2>
            <p className="m-0 mb-1 text-base font-semibold text-caramel">Order #{orderSuccess.order_id}</p>
            <p className="m-0 mb-1 text-xl font-bold text-espresso">ยอดรวม ฿{Number(orderSuccess.total_amount).toFixed(2)}</p>
            <p className="m-0 mb-6 text-sm text-mocha">สถานะ: pending</p>
            <button
              type="button"
              className="px-8 py-3 border-none rounded-[10px] bg-espresso text-cream text-base font-semibold cursor-pointer hover:bg-[#3a2819] transition-colors"
              onClick={newOrder}
              title="สั่งซื้อใหม่"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col bg-cream">
      <header className="flex items-center justify-between gap-4 px-7 py-4 border-b border-border bg-white">
        <div className="flex flex-col gap-0.5">
          <p className="m-0 text-[11px] font-bold tracking-[0.34em] text-caramel">MINI CAFE</p>
          <h1 className="m-0 font-display font-semibold text-2xl leading-tight text-espresso">Staff Order</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-cream-deep text-espresso text-[13px] font-bold">{user.username}</span>
          <button type="button" className="px-4 py-2 border-[1.5px] border-border rounded-lg bg-transparent text-mocha text-sm font-semibold cursor-pointer hover:border-error hover:text-error hover:bg-error-bg focus-visible:outline-3 focus-visible:outline-caramel focus-visible:outline-offset-2 transition-colors" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-[1fr_320px] gap-6 p-6 overflow-hidden">
        <section className="flex flex-col gap-5 overflow-hidden">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={`px-4 py-2 border-[1.5px] border-border rounded-lg bg-white text-mocha text-sm font-semibold cursor-pointer transition-all hover:border-caramel-light hover:text-espresso ${selectedCategory === null ? 'border-caramel bg-espresso text-cream' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.category_id}
                type="button"
                className={`px-4 py-2 border-[1.5px] border-border rounded-lg bg-white text-mocha text-sm font-semibold cursor-pointer transition-all hover:border-caramel-light hover:text-espresso ${selectedCategory === cat.category_id ? 'border-caramel bg-espresso text-cream' : ''}`}
                onClick={() => setSelectedCategory(cat.category_id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 overflow-y-auto pr-2">
            {loading ? (
              <p className="col-span-full text-center py-10 text-mocha">Loading...</p>
            ) : products.length === 0 ? (
              <p className="col-span-full text-center py-10 text-mocha">ไม่มีสินค้า</p>
            ) : (
              products.map(product => (
                <div key={product.product_id} className="flex flex-col justify-between p-4 border border-border rounded-xl bg-white transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(42,28,19,0.3)]">
                  {product.image && (
                    <img
                      className="w-full h-[140px] object-contain rounded-lg mb-3 bg-cream"
                      src={product.image}
                      alt={product.name}
                    />
                  )}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="m-0 text-base font-semibold text-espresso">{product.name}</h3>
                    <p className="m-0 text-[13px] text-mocha leading-normal">{product.description}</p>
                    <p className="mt-2 text-lg font-bold text-caramel">฿{Number(product.price).toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    className="mt-3 py-2.5 px-0 border-none rounded-lg bg-espresso text-cream text-sm font-semibold cursor-pointer hover:bg-[#3a2819] transition-colors"
                    onClick={() => addToCart(product)}
                    title="เพิ่มลงตะกร้า"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="flex flex-col p-5 border border-border rounded-xl bg-white h-fit max-h-[calc(100vh-140px)] sticky top-6">
          <h2 className="m-0 mb-4 text-lg font-semibold text-espresso">Order Summary</h2>

          {cart.length === 0 ? (
            <p className="text-center py-6 text-mocha text-sm">ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            <>
              <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                {cart.map(item => (
                  <div key={item.product_id} className="flex flex-col gap-2 p-3 border border-border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-espresso">{item.name}</span>
                      <span className="font-semibold text-caramel">฿{Number(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="w-7 h-7 border border-border rounded-md bg-cream text-espresso text-base font-semibold cursor-pointer flex items-center justify-center hover:bg-cream-deep"
                        onClick={() => updateQuantity(item.product_id, -1)}
                        title="ลดจำนวน"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="min-w-6 text-center font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        className="w-7 h-7 border border-border rounded-md bg-cream text-espresso text-base font-semibold cursor-pointer flex items-center justify-center hover:bg-cream-deep"
                        onClick={() => updateQuantity(item.product_id, 1)}
                        title="เพิ่มจำนวน"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="ml-auto px-2 py-1 border-none rounded bg-transparent text-error text-sm cursor-pointer hover:bg-error-bg"
                        onClick={() => removeFromCart(item.product_id)}
                        title="ลบออกจากตะกร้า"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-4 text-base font-semibold text-espresso">
                  <span>Total</span>
                  <span className="text-xl text-caramel">฿{Number(getTotalAmount()).toFixed(2)}</span>
                </div>
                {orderError && (
                  <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-error-bg text-error text-[13px] font-semibold text-center" role="alert">{orderError}</p>
                )}
                <button
                  type="button"
                  className="w-full py-3.5 px-0 border-none rounded-[10px] bg-caramel text-white text-base font-bold cursor-pointer hover:bg-[#9a7a5a] disabled:bg-mocha disabled:cursor-not-allowed transition-colors"
                  disabled={orderLoading}
                  onClick={placeOrder}
                  title="สั่งซื้อ"
                >
                  {orderLoading ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  )
}
