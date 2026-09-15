import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const CATEGORY_GRADIENTS = {
  1: { from: '#6F4A31', to: '#3A2314' },
  2: { from: '#DE9A3E', to: '#B5651F' },
  3: { from: '#96604A', to: '#5E3B2A' },
}

function ProductSvgIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FFF8EC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 54V18a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v36" />
      <path d="M18 54h28" />
      <path d="M28 16V10a4 4 0 0 1 8 0v6" />
      <path d="M25 32h14" />
      <path d="M25 40h14" />
    </svg>
  )
}

function SmallProductSvgIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FFF8EC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 54V18a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v36" />
      <path d="M18 54h28" />
      <path d="M28 16V10a4 4 0 0 1 8 0v6" />
    </svg>
  )
}

export default function Order({ user, onLogout }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [lastOrderItems, setLastOrderItems] = useState([])
  const [drawn, setDrawn] = useState(false)
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

  function getCartQuantity(productId) {
    const item = cart.find(i => i.product_id === productId)
    return item ? item.quantity : 0
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

      const savedItems = [...cart]
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

      setLastOrderItems(savedItems)
      setOrderSuccess(data.data)
      setCart([])
    } catch {
      setOrderError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setOrderLoading(false)
    }
  }

  function newOrder() {
    setOrderSuccess(null)
    setLastOrderItems([])
    setOrderError('')
  }

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    if (orderSuccess) {
      setDrawn(false)
      const t = setTimeout(() => setDrawn(true), 120)
      return () => clearTimeout(t)
    }
  }, [orderSuccess])

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const day = d.getDate()
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const month = months[d.getMonth()]
    const year = d.getFullYear() + 543
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    return `${day} ${month} ${year} · ${time}`
  }

  if (orderSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-10 text-ink">
        <style>{`
          .check-circle { stroke-dasharray: 132; stroke-dashoffset: 132; transition: stroke-dashoffset 0.6s ease; }
          .check-tick { stroke-dasharray: 36; stroke-dashoffset: 36; transition: stroke-dashoffset 0.4s ease 0.5s; }
          .drawn .check-circle { stroke-dashoffset: 0; }
          .drawn .check-tick { stroke-dashoffset: 0; }
        `}</style>

        <div className={`w-full max-w-[380px] overflow-hidden rounded-[14px] border border-border bg-white shadow-[0_18px_40px_rgba(36,26,18,0.10)] ${drawn ? 'drawn' : ''}`}>
          {/* Confirmation */}
          <div className="px-8 pt-9 pb-6 text-center">
            <svg width="64" height="64" viewBox="0 0 64 64" className="mx-auto mb-[18px]">
              <circle className="check-circle" cx="32" cy="32" r="21" fill="none" stroke="#3F8E5C" strokeWidth="4" strokeLinecap="round" />
              <path className="check-tick" d="M22 33l7 7 13-15" fill="none" stroke="#3F8E5C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h1 className="font-display mb-1.5 text-[26px] font-semibold text-ink">สั่งซื้อสำเร็จ!</h1>
            <p className="m-0 text-[13px] text-ink-muted">ออเดอร์ของคุณถูกส่งเข้าครัวแล้ว</p>
          </div>

          {/* Perforated divider */}
          <div className="relative mx-6 h-1 bg-border">
            <div
              className="absolute inset-x-0 h-[7px] -top-[3px]"
              style={{
                backgroundImage: 'radial-gradient(circle, #FAF3E8 3px, transparent 3.5px)',
                backgroundSize: '14px 1px',
                backgroundPosition: 'center',
              }}
            />
          </div>

          {/* Receipt body */}
          <div className="px-8 pt-[22px] pb-5">
            <div className="mb-1 flex justify-between">
              <span className="font-mono text-[13px] text-ink-muted">Order</span>
              <span className="font-mono text-[13px] font-medium">#{orderSuccess.order_id}</span>
            </div>
            <div className="mb-[18px] flex justify-between">
              <span className="font-mono text-[13px] text-ink-muted">เวลา</span>
              <span className="font-mono text-[13px]">{formatTime(orderSuccess.created_at)}</span>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              {lastOrderItems.map(item => (
                <div key={item.product_id} className="flex justify-between font-mono text-[13.5px]">
                  <span>{item.quantity}× {item.name}</span>
                  <span>฿{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between border-t border-dashed border-border pt-3.5">
              <span className="font-display text-[15px] font-semibold">รวมทั้งหมด</span>
              <span className="font-display text-[24px] font-bold">฿{Number(orderSuccess.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 px-8 pb-8 pt-2">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-rust py-3 text-sm font-semibold text-white transition-colors hover:bg-rust-dark"
              onClick={newOrder}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              สั่งซื้อใหม่
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-cream text-ink">
      {/* Header + Category Tabs — unified */}
      <header className="px-10">
        <div className="flex flex-wrap items-end justify-between gap-3 pt-6 pb-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-rust">MINI CAFE</p>
            <h1 className="font-display text-[34px] font-semibold leading-tight text-ink">สั่งออเดอร์</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-ink-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItemCount > 0 ? (
                <>
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rust px-1.5 text-[11px] font-bold text-white">{totalItemCount}</span>
                  <span>รายการ</span>
                </>
              ) : (
                <span>ว่าง</span>
              )}
            </div>
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-espresso cursor-pointer transition-colors hover:bg-cream-deep"
                title="เข้าระบบแอดมิน"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                แอดมิน
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-white text-espresso cursor-pointer transition-colors hover:bg-cream-deep"
              title="ออกจากระบบ"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            style={selectedCategory === null ? { background: '#2a1c13', color: '#fff' } : undefined}
            className={`shrink-0 whitespace-nowrap rounded-full bg-transparent px-4 py-1.5 text-[15px] transition-colors ${selectedCategory === null ? 'font-bold' : 'font-semibold text-espresso hover:bg-cream-deep'}`}
            onClick={() => setSelectedCategory(null)}
          >
            ทั้งหมด
          </button>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              type="button"
              style={selectedCategory === cat.category_id ? { background: '#2a1c13', color: '#fff' } : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full bg-transparent px-4 py-1.5 text-[15px] transition-colors ${selectedCategory === cat.category_id ? 'font-bold' : 'font-semibold text-espresso hover:bg-cream-deep'}`}
              onClick={() => setSelectedCategory(cat.category_id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-wrap items-start gap-8 px-10 pt-8 pb-7">
        {/* Product Grid */}
        <div className="min-w-0 flex-1 basis-[600px]">
          {loading ? (
            <div className="py-16 text-center text-ink-muted">กำลังโหลด...</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-ink-muted">ไม่มีสินค้า</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
              {products.map(product => {
                const gradient = CATEGORY_GRADIENTS[product.category_id] || CATEGORY_GRADIENTS[1]
                const qty = getCartQuantity(product.product_id)
                const category = categories.find(c => c.category_id === product.category_id)

                return (
                  <div
                    key={product.product_id}
                    className="overflow-hidden rounded-[10px] border border-border bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(36,26,18,0.10)]"
                  >
                    {/* Card Header with Gradient */}
                    <div
                      className="relative flex h-[150px] items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                    >
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/22 px-2.5 py-[3px] text-[11px] text-[#FFF8EC]">
                        {category ? category.name : 'Product'}
                      </span>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      ) : (
                        <ProductSvgIcon />
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="px-3.5 pt-3.5 pb-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-[17px] font-semibold text-ink">{product.name}</h3>
                        <span className="shrink-0 font-semibold text-rust">฿{Number(product.price).toFixed(2)}</span>
                      </div>

                      {qty === 0 ? (
                        <button
                          type="button"
                          className="mt-3 w-full rounded-md bg-rust py-2.5 text-sm font-medium text-white transition-colors hover:bg-rust-dark"
                          onClick={() => addToCart(product)}
                        >
                          เพิ่มลงตะกร้า
                        </button>
                      ) : (
                        <div className="mt-3 flex items-center justify-between rounded-md bg-rust-soft px-1.5 py-1">
                          <button
                            type="button"
                            className="cursor-pointer border-none bg-transparent p-1.5 text-rust-dark"
                            onClick={() => updateQuantity(product.product_id, -1)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <span className="text-sm font-semibold">{qty}</span>
                          <button
                            type="button"
                            className="cursor-pointer border-none bg-transparent p-1.5 text-rust-dark"
                            onClick={() => addToCart(product)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <aside className="sticky top-6 w-[300px] shrink-0 rounded-[10px] border border-border bg-white p-5">
          <h2 className="font-display mb-3.5 text-[19px] font-semibold text-ink">ตะกร้าออเดอร์</h2>

          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3">
                {cart.map(item => {
                  const gradient = CATEGORY_GRADIENTS[item.category_id] || CATEGORY_GRADIENTS[1]
                  return (
                    <div key={item.product_id} className="flex items-center gap-2.5">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                      >
                        <div className="scale-50"><SmallProductSvgIcon /></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-ink-muted">{item.quantity} × ฿{Number(item.price).toFixed(2)}</div>
                      </div>
                      <span className="text-[13px] font-semibold">฿{Number(item.price * item.quantity).toFixed(2)}</span>
                      <button
                        type="button"
                        className="cursor-pointer border-none bg-transparent p-1 text-ink-muted"
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="mb-3.5 border-t border-border pt-3.5">
                <div className="flex justify-between text-[15px] font-semibold">
                  <span>รวมทั้งหมด</span>
                  <span>฿{Number(getTotalAmount()).toFixed(2)}</span>
                </div>
              </div>

              {orderError && (
                <div className="mb-3 rounded-lg bg-error-bg px-3 py-2.5 text-center text-[13px] font-semibold text-error" role="alert">
                  {orderError}
                </div>
              )}

              <button
                type="button"
                className={`w-full rounded-md py-3 text-sm font-semibold text-white transition-colors ${orderLoading ? 'cursor-not-allowed bg-ink-muted' : 'cursor-pointer bg-rust hover:bg-rust-dark'}`}
                disabled={orderLoading}
                onClick={placeOrder}
              >
                {orderLoading ? 'กำลังสั่งซื้อ...' : 'ยืนยันออเดอร์'}
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
