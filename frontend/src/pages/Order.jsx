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

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (orderSuccess) {
    return (
      <div className="min-h-full bg-cream text-ink">
        <header className="border-b border-border px-10 py-6">
          <p className="text-[11px] font-bold tracking-[0.12em] text-rust">MINI CAFE</p>
          <h1 className="font-display text-[34px] font-semibold leading-tight text-ink">สั่งออเดอร์</h1>
        </header>

        <main className="flex min-h-[calc(100vh-100px)] items-center justify-center p-10">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2d9d4e]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-display mb-2 text-[28px] font-semibold text-ink">สั่งซื้อสำเร็จ!</h2>
            <p className="mb-1 text-base font-semibold text-rust">Order #{orderSuccess.order_id}</p>
            <p className="mb-1 text-[22px] font-bold text-ink">฿{Number(orderSuccess.total_amount).toFixed(2)}</p>
            <p className="mb-8 text-sm text-ink-muted">สถานะ: pending</p>
            <button
              type="button"
              className="rounded-lg bg-rust px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-rust-dark"
              onClick={newOrder}
            >
              สั่งซื้อใหม่
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-cream text-ink">
      {/* Header */}
      <header className="border-b border-border px-10 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-rust">MINI CAFE</p>
            <h1 className="font-display text-[34px] font-semibold leading-tight text-ink">สั่งออเดอร์</h1>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-ink-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>{totalItemCount} รายการในตะกร้า</span>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="px-10 pt-7">
        <div className="mb-6 flex gap-6 overflow-x-auto border-b border-border scrollbar-thin">
          <button
            type="button"
            className={`shrink-0 whitespace-nowrap border-b-2 bg-transparent px-0.5 pb-3 text-[15px] transition-colors ${selectedCategory === null ? 'border-rust font-semibold text-ink' : 'border-transparent font-medium text-ink-muted'}`}
            onClick={() => setSelectedCategory(null)}
          >
            ทั้งหมด
          </button>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              type="button"
              className={`shrink-0 whitespace-nowrap border-b-2 bg-transparent px-0.5 pb-3 text-[15px] transition-colors ${selectedCategory === cat.category_id ? 'border-rust font-semibold text-ink' : 'border-transparent font-medium text-ink-muted'}`}
              onClick={() => setSelectedCategory(cat.category_id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-wrap items-start gap-8 px-10 pb-7">
        {/* Product Grid */}
        <div className="min-w-0 flex-1 basis-[600px]">
          {loading ? (
            <div className="py-16 text-center text-ink-muted">กำลังโหลด...</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-ink-muted">ไม่มีสินค้า</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
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
