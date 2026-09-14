import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from './api'

export default function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  function showError(msg) {
    setError(msg)
    setTimeout(() => setError(''), 2000)
  }

  function showSuccess(msg) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 2000)
  }

  useEffect(() => {
    fetchStats()
    fetchOrders()
    fetchProducts()
    fetchCategories()
  }, [])

  async function fetchStats() {
    try {
      const res = await apiFetch('/api/admin/dashboard')
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch {
      showError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrders() {
    try {
      const res = await apiFetch('/api/orders')
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } catch {
      showError('ไม่สามารถโหลดรายการ Order ได้')
    } finally {
      setOrdersLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      setProductsLoading(true)
      const res = await apiFetch('/api/products?show_all=true')
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch {
      showError('ไม่สามารถโหลดรายการสินค้าได้')
    } finally {
      setProductsLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const res = await apiFetch('/api/categories')
      const data = await res.json()
      if (data.success) setCategories(data.data)
    } catch {
      setCategories([])
    }
  }

  async function toggleAvailability(productId, currentStatus) {
    try {
      const res = await apiFetch(`/api/products/${productId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !currentStatus })
      })
      const data = await res.json()
      if (data.success) {
        setProducts(prev =>
          prev.map(p =>
            p.product_id === productId
              ? { ...p, is_available: !currentStatus }
              : p
          )
        )
        showSuccess(data.message)
      }
    } catch {
      showError('ไม่สามารถเปลี่ยนสถานะสินค้าได้')
    }
  }

  function openAddProductForm() {
    setEditingProduct(null)
    setFormName('')
    setFormPrice('')
    setFormCategoryId('')
    setFormDescription('')
    setFormImage('')
    setFormError('')
    setShowProductForm(true)
  }

  function openEditProductForm(product) {
    setEditingProduct(product)
    setFormName(product.name)
    setFormPrice(String(product.price))
    setFormCategoryId(String(product.category_id))
    setFormDescription(product.description || '')
    setFormImage(product.image || '')
    setFormError('')
    setShowProductForm(true)
  }

  function closeProductForm() {
    setEditingProduct(null)
    setFormError('')
    setShowProductForm(false)
  }

  async function deleteProduct(productId) {
    if (!window.confirm('ต้องการลบสินค้านี้ใช่หรือไม่?')) return

    try {
      const res = await apiFetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!data.success) {
        showError(data.message)
        return
      }

      showSuccess(data.message)
      fetchProducts()
    } catch {
      showError('ไม่สามารถลบสินค้าได้')
    }
  }

  async function saveProduct() {
    if (!formName.trim() || !formPrice || !formCategoryId) {
      setFormError('กรุณากรอกชื่อสินค้า, ราคา, และหมวดหมู่')
      return
    }

    const parsedPrice = parseFloat(formPrice)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError('ราคาต้องมากกว่า 0')
      return
    }

    setFormLoading(true)
    setFormError('')

    try {
      const body = {
        name: formName.trim(),
        price: parsedPrice,
        category_id: parseInt(formCategoryId, 10),
        description: formDescription.trim() || null,
        image: formImage.trim() || null
      }

      const url = editingProduct
        ? `/api/products/${editingProduct.product_id}`
        : '/api/products'

      const res = await apiFetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!data.success) {
        setFormError(data.message)
        setFormLoading(false)
        return
      }

      showSuccess(data.message)
      closeProductForm()
      fetchProducts()
    } catch {
      setFormError('ไม่สามารถบันทึกสินค้าได้')
    } finally {
      setFormLoading(false)
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        setOrders(prev =>
          prev.map(o => (o.order_id === orderId ? { ...o, status: newStatus } : o))
        )
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }))
        }
      }
    } catch {
      showError('ไม่สามารถอัปเดตสถานะได้')
    }
  }

  function getStatusLabel(status) {
    const labels = {
      pending: 'รอดำเนินการ',
      preparing: 'กำลังเตรียม',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก'
    }
    return labels[status] || status
  }

  function getStatusClass(status) {
    const classes = {
      pending: 'bg-[#FEF3E2] text-[#E67E22]',
      preparing: 'bg-[#EBF5FB] text-[#3498DB]',
      completed: 'bg-[#EAFAF1] text-[#2ECC71]',
      cancelled: 'bg-[#FDEDEC] text-[#E74C3C]'
    }
    return classes[status] || ''
  }

  function formatDateTime(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-full flex flex-col bg-cream">
      <header className="flex items-center justify-between gap-4 px-7 py-4 border-b border-border bg-white">
        <div className="flex flex-col gap-0.5">
          <p className="m-0 text-[11px] font-bold tracking-[0.34em] text-caramel">MINI CAFE</p>
          <h1 className="m-0 font-display font-semibold text-2xl leading-tight text-espresso">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-espresso text-cream text-[13px] font-bold">{user.username}</span>
          <button type="button" className="px-4 py-2 border-[1.5px] border-border rounded-lg bg-transparent text-mocha text-sm font-semibold cursor-pointer hover:border-error hover:text-error hover:bg-error-bg focus-visible:outline-3 focus-visible:outline-caramel focus-visible:outline-offset-2 transition-colors" onClick={onLogout} title="ออกจากระบบ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <nav className="flex-shrink-0 flex flex-col gap-1 w-[200px] py-4 px-3 border-r border-border bg-white" aria-label="Admin">
          <button
            type="button"
            className={`flex items-center gap-2.5 py-2.5 px-3 border-none rounded-lg bg-transparent text-mocha text-sm font-semibold text-left cursor-pointer transition-all hover:text-espresso hover:bg-cream ${tab === 'dashboard' ? 'bg-espresso text-cream' : ''}`}
            onClick={() => setTab('dashboard')}
          >
            <svg className="flex-shrink-0 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-2.5 py-2.5 px-3 border-none rounded-lg bg-transparent text-mocha text-sm font-semibold text-left cursor-pointer transition-all hover:text-espresso hover:bg-cream ${tab === 'orders' ? 'bg-espresso text-cream' : ''}`}
            onClick={() => setTab('orders')}
          >
            <svg className="flex-shrink-0 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="m9 14 2 2 4-4" />
            </svg>
            <span>Orders</span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-2.5 py-2.5 px-3 border-none rounded-lg bg-transparent text-mocha text-sm font-semibold text-left cursor-pointer transition-all hover:text-espresso hover:bg-cream ${tab === 'products' ? 'bg-espresso text-cream' : ''}`}
            onClick={() => setTab('products')}
          >
            <svg className="flex-shrink-0 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
              <circle cx="7" cy="7" r="1.2" />
            </svg>
            <span>Products</span>
          </button>
        </nav>

        <main className="flex-1 min-w-0 flex flex-col gap-6 p-6 overflow-y-auto">
          {error && (
            <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-error-bg text-error text-[13px] font-semibold text-center" role="alert">{error}</p>
          )}
          {success && (
            <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-[#EAFAF1] text-[#2ECC71] text-[13px] font-semibold text-center" role="status">{success}</p>
          )}

          {tab === 'dashboard' && (
            loading ? (
              <p className="col-span-full text-center py-10 text-mocha">Loading...</p>
            ) : stats && (
              <section className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                <div className="flex flex-col items-center py-5 px-4 border border-border rounded-xl bg-white text-center transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(42,28,19,0.3)]">
                  <p className="m-0 mb-2 text-[13px] text-mocha">Orders วันนี้</p>
                  <p className="m-0 text-[28px] font-bold text-espresso">{stats.orders.today}</p>
                  <p className="mt-1 text-[13px] text-mocha">฿{Number(stats.revenue.today).toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center py-5 px-4 border border-border rounded-xl bg-white text-center transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(42,28,19,0.3)]">
                  <p className="m-0 mb-2 text-[13px] text-mocha">Orders ทั้งหมด</p>
                  <p className="m-0 text-[28px] font-bold text-espresso">{stats.orders.total}</p>
                  <p className="mt-1 text-[13px] text-mocha">฿{Number(stats.revenue.total).toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center py-5 px-4 border border-border rounded-xl bg-white text-center transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(42,28,19,0.3)]">
                  <p className="m-0 mb-2 text-[13px] text-mocha">รอดำเนินการ</p>
                  <p className="m-0 text-[28px] font-bold text-[#E67E22]">{stats.status.pending}</p>
                </div>
                <div className="flex flex-col items-center py-5 px-4 border border-border rounded-xl bg-white text-center transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(42,28,19,0.3)]">
                  <p className="m-0 mb-2 text-[13px] text-mocha">กำลังเตรียม</p>
                  <p className="m-0 text-[28px] font-bold text-[#3498DB]">{stats.status.preparing}</p>
                </div>
                <div className="flex flex-col items-center py-5 px-4 border border-border rounded-xl bg-white text-center transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(42,28,19,0.3)]">
                  <p className="m-0 mb-2 text-[13px] text-mocha">เสร็จสิ้น</p>
                  <p className="m-0 text-[28px] font-bold text-[#2ECC71]">{stats.status.completed}</p>
                </div>
                <div className="flex flex-col items-center py-5 px-4 border border-border rounded-xl bg-white text-center transition-shadow hover:shadow-[0_24px_60px_-18px_rgba(42,28,19,0.3)]">
                  <p className="m-0 mb-2 text-[13px] text-mocha">สินค้า / ผู้ใช้</p>
                  <p className="m-0 text-[28px] font-bold text-espresso">{stats.products.total}</p>
                  <p className="mt-1 text-[13px] text-mocha">{stats.users} ผู้ใช้</p>
                </div>
              </section>
            )
          )}

          {tab === 'orders' && (
            <section className="flex flex-col gap-4">
              <h2 className="m-0 mb-4 text-lg font-semibold text-espresso">รายการ Order ล่าสุด</h2>

              {ordersLoading ? (
                <p className="col-span-full text-center py-10 text-mocha">Loading...</p>
              ) : orders.length === 0 ? (
                <p className="col-span-full text-center py-10 text-mocha">ยังไม่มี Order</p>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl bg-white">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">Order</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">ลูกค้า</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">รายการ</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">ยอดรวม</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">สถานะ</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">เวลา</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.order_id} className="hover:bg-cream">
                          <td className="px-4 py-3 border-b border-border text-espresso align-middle font-bold text-caramel whitespace-nowrap text-center">#{order.order_id}</td>
                          <td className="px-4 py-3 border-b border-border text-espresso align-middle text-center">{order.user_name || order.username}</td>
                          <td className="px-4 py-3 border-b border-border text-espresso align-middle max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap text-mocha text-[13px] text-center">
                            {order.items.map(i => `${i.product_name} x${i.quantity}`).join(', ')}
                          </td>
                          <td className="px-4 py-3 border-b border-border text-espresso align-middle font-semibold whitespace-nowrap text-center">฿{Number(order.total_amount).toFixed(2)}</td>
                          <td className="px-4 py-3 border-b border-border text-espresso align-middle text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusClass(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b border-border text-espresso align-middle whitespace-nowrap text-[13px] text-mocha text-center">{formatDateTime(order.created_at)}</td>
                          <td className="px-4 py-3 border-b border-border text-espresso align-middle text-center">
                            <button
                              type="button"
                              className="px-3 py-1.5 border-[1.5px] border-border rounded-md bg-transparent text-espresso text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all hover:border-caramel hover:text-caramel"
                              onClick={() => setSelectedOrder(order)}
                              title="ดูรายละเอียด"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {tab === 'products' && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="m-0 text-lg font-semibold text-espresso">รายการสินค้า</h2>
                <button
                  type="button"
                  className="mt-3 py-2.5 px-0 border-none rounded-lg bg-espresso text-cream text-sm font-semibold cursor-pointer hover:bg-[#3a2819] transition-colors"
                  onClick={openAddProductForm}
                  title="เพิ่มสินค้า"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              {productsLoading ? (
                <p className="col-span-full text-center py-10 text-mocha">Loading...</p>
              ) : products.length === 0 ? (
                <p className="col-span-full text-center py-10 text-mocha">ยังไม่มีสินค้า</p>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl bg-white">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">ID</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">ชื่อสินค้า</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">ราคา</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">หมวดหมู่</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">สถานะ</th>
                        <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-border whitespace-nowrap">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => {
                        const category = categories.find(c => c.category_id === product.category_id)
                        return (
                          <tr key={product.product_id} className="hover:bg-cream">
                            <td className="px-4 py-3 border-b border-border text-espresso align-middle font-bold text-caramel whitespace-nowrap text-center">{product.product_id}</td>
                            <td className="px-4 py-3 border-b border-border text-espresso align-middle text-center">{product.name}</td>
                            <td className="px-4 py-3 border-b border-border text-espresso align-middle font-semibold whitespace-nowrap text-center">฿{Number(product.price).toFixed(2)}</td>
                            <td className="px-4 py-3 border-b border-border text-espresso align-middle text-center">{category ? category.name : '-'}</td>
                            <td className="px-4 py-3 border-b border-border text-espresso align-middle text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${product.is_available ? 'bg-[#EAFAF1] text-[#2ECC71]' : 'bg-[#FDEDEC] text-[#E74C3C]'}`}>
                                {product.is_available ? 'เปิดขาย' : 'ปิดขาย'}
                              </span>
                            </td>
                            <td className="px-4 py-3 border-b border-border text-espresso align-middle text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-md bg-[#3498DB] text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all hover:bg-[#2980B9]"
                                  onClick={() => openEditProductForm(product)}
                                  title="แก้ไข"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-md bg-[#E74C3C] text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all hover:bg-[#C0392B]"
                                  onClick={() => deleteProduct(product.product_id)}
                                  title="ลบ"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className={`px-3 py-1.5 rounded-md text-white text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all ${product.is_available ? 'bg-[#F39C12] hover:bg-[#D68910]' : 'bg-[#2ECC71] hover:bg-[#27AE60]'}`}
                                  onClick={() => toggleAvailability(product.product_id, product.is_available)}
                                  title={product.is_available ? 'ปิดขาย' : 'เปิดขาย'}
                                >
                                  {product.is_available ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                      <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {selectedOrder && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/45 z-[100] p-6" onClick={() => setSelectedOrder(null)}>
              <div className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between py-5 px-6 border-b border-border">
                  <h3 className="m-0 text-lg font-bold text-espresso">Order #{selectedOrder.order_id}</h3>
                  <button
                    type="button"
                    className="w-8 h-8 border-none rounded-lg bg-cream text-mocha text-base font-bold cursor-pointer flex items-center justify-center hover:bg-cream-deep transition-colors"
                    onClick={() => setSelectedOrder(null)}
                    title="ปิด"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col gap-4 py-5 px-6">
                  <div className="flex justify-between items-center text-sm text-espresso">
                    <span className="text-mocha font-semibold">ลูกค้า</span>
                    <span>{selectedOrder.user_name || selectedOrder.username}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-espresso">
                    <span className="text-mocha font-semibold">วันที่</span>
                    <span>{formatDateTime(selectedOrder.created_at)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-espresso">
                    <span className="text-mocha font-semibold">สถานะ</span>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusClass(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>

                  <h4 className="m-0 text-[15px] font-semibold text-espresso border-t border-border pt-3">รายการสินค้า</h4>
                  <div className="flex flex-col gap-2.5">
                    {selectedOrder.items.map(item => (
                      <div key={item.order_item_id || item.product_id} className="flex items-center gap-3 py-2.5 px-3 border border-border rounded-lg">
                        <span className="flex-1 font-semibold text-espresso">{item.product_name}</span>
                        <span className="text-[13px] text-mocha min-w-[30px] text-center">x{item.quantity}</span>
                        <span className="font-semibold text-caramel min-w-[70px] text-right">฿{Number(item.total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-border font-bold text-espresso">
                    <span>ยอดรวม</span>
                    <span className="text-xl text-caramel">฿{Number(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {selectedOrder.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="flex-1 py-2.5 px-0 border-none rounded-lg bg-[#3498DB] text-white text-sm font-bold cursor-pointer transition-opacity hover:opacity-85"
                          onClick={() => updateOrderStatus(selectedOrder.order_id, 'preparing')}
                          title="เริ่มเตรียม"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 2v4" />
                            <path d="m4.93 4.93 2.83 2.83" />
                            <path d="M2 12h4" />
                            <path d="m19.07 4.93-2.83 2.83" />
                            <path d="M22 12h-4" />
                            <circle cx="12" cy="12" r="4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="flex-1 py-2.5 px-0 border-none rounded-lg bg-[#E74C3C] text-white text-sm font-bold cursor-pointer transition-opacity hover:opacity-85"
                          onClick={() => updateOrderStatus(selectedOrder.order_id, 'cancelled')}
                          title="ยกเลิก"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </button>
                      </>
                    )}
                    {selectedOrder.status === 'preparing' && (
                      <button
                        type="button"
                        className="flex-1 py-2.5 px-0 border-none rounded-lg bg-[#2ECC71] text-white text-sm font-bold cursor-pointer transition-opacity hover:opacity-85"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'completed')}
                        title="เสร็จสิ้น"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showProductForm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/45 z-[100] p-6" onClick={closeProductForm}>
              <div className="w-full max-w-[520px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between py-5 px-6 border-b border-border">
                  <h3 className="m-0 text-lg font-bold text-espresso">
                    {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                  </h3>
                  <button
                    type="button"
                    className="w-8 h-8 border-none rounded-lg bg-cream text-mocha text-base font-bold cursor-pointer flex items-center justify-center hover:bg-cream-deep transition-colors"
                    onClick={closeProductForm}
                    title="ปิด"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col gap-4 py-5 px-6">
                  {formError && (
                    <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-error-bg text-error text-[13px] font-semibold text-center" role="alert">{formError}</p>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="form-name" className="text-[13px] font-semibold text-mocha">ชื่อสินค้า *</label>
                    <input
                      id="form-name"
                      type="text"
                      placeholder="กรอกชื่อสินค้า"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="py-2.5 px-3 border-[1.5px] border-border rounded-lg bg-white text-espresso text-sm transition-colors focus:outline-none focus:border-caramel"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="form-price" className="text-[13px] font-semibold text-mocha">ราคา (฿) *</label>
                    <input
                      id="form-price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="กรอกราคา"
                      value={formPrice}
                      onChange={e => setFormPrice(e.target.value)}
                      className="py-2.5 px-3 border-[1.5px] border-border rounded-lg bg-white text-espresso text-sm transition-colors focus:outline-none focus:border-caramel"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="form-category" className="text-[13px] font-semibold text-mocha">หมวดหมู่ *</label>
                    <select
                      id="form-category"
                      value={formCategoryId}
                      onChange={e => setFormCategoryId(e.target.value)}
                      className="py-2.5 px-3 border-[1.5px] border-border rounded-lg bg-white text-espresso text-sm transition-colors focus:outline-none focus:border-caramel"
                    >
                      <option value="">เลือกหมวดหมู่</option>
                      {categories.map(cat => (
                        <option key={cat.category_id} value={cat.category_id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="form-description" className="text-[13px] font-semibold text-mocha">รายละเอียด</label>
                    <textarea
                      id="form-description"
                      placeholder="กรอกรายละเอียดสินค้า"
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                      className="py-2.5 px-3 border-[1.5px] border-border rounded-lg bg-white text-espresso text-sm transition-colors focus:outline-none focus:border-caramel min-h-[80px] resize-y"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="form-image" className="text-[13px] font-semibold text-mocha">รูปภาพ (URL)</label>
                    <input
                      id="form-image"
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={formImage}
                      onChange={e => setFormImage(e.target.value)}
                      className="py-2.5 px-3 border-[1.5px] border-border rounded-lg bg-white text-espresso text-sm transition-colors focus:outline-none focus:border-caramel"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      className="flex-1 py-2.5 px-0 border-none rounded-lg bg-[#2ECC71] text-white text-sm font-bold cursor-pointer transition-opacity hover:opacity-85 flex items-center justify-center gap-2"
                      onClick={saveProduct}
                      disabled={formLoading}
                      title="ยืนยัน"
                    >
                      {formLoading ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="spin">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                      )}
                      {!formLoading && 'ยืนยัน'}
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-2.5 px-0 border-none rounded-lg bg-[#E74C3C] text-white text-sm font-bold cursor-pointer transition-opacity hover:opacity-85 flex items-center justify-center gap-2"
                      onClick={closeProductForm}
                      title="ยกเลิก"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
