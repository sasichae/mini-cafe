import { useState, useEffect } from 'react'
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
      pending: 'status-pending',
      preparing: 'status-preparing',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
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
    <div className="page">
      <header className="topbar">
        <div className="topbar-brand">
          <p className="topbar-kicker">MINI CAFE</p>
          <h1 className="topbar-title">Admin Dashboard</h1>
        </div>
        <div className="topbar-actions">
          <span className="role-chip role-chip-admin">{user.username}</span>
          <button type="button" className="logout-button" onClick={onLogout} title="ออกจากระบบ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <nav className="admin-sidebar" aria-label="Admin">
          <button
            type="button"
            className={`sidebar-item ${tab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setTab('dashboard')}
          >
            <svg
              className="sidebar-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`sidebar-item ${tab === 'orders' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            <svg
              className="sidebar-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="m9 14 2 2 4-4" />
            </svg>
            <span>Orders</span>
          </button>
          <button
            type="button"
            className={`sidebar-item ${tab === 'products' ? 'active' : ''}`}
            onClick={() => setTab('products')}
          >
            <svg
              className="sidebar-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
              <circle cx="7" cy="7" r="1.2" />
            </svg>
            <span>Products</span>
          </button>
        </nav>

      <main className="admin-main">
        {error && (
          <p className="order-error" role="alert">{error}</p>
        )}
        {success && (
          <p className="success-message" role="status">{success}</p>
        )}

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          loading ? (
            <p className="loading-text">Loading...</p>
          ) : stats && (
            <section className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Orders วันนี้</p>
                <p className="stat-value">{stats.orders.today}</p>
                <p className="stat-sub">฿{Number(stats.revenue.today).toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Orders ทั้งหมด</p>
                <p className="stat-value">{stats.orders.total}</p>
                <p className="stat-sub">฿{Number(stats.revenue.total).toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">รอดำเนินการ</p>
                <p className="stat-value stat-pending">{stats.status.pending}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">กำลังเตรียม</p>
                <p className="stat-value stat-preparing">{stats.status.preparing}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">เสร็จสิ้น</p>
                <p className="stat-value stat-completed">{stats.status.completed}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">สินค้า / ผู้ใช้</p>
                <p className="stat-value">{stats.products.total}</p>
                <p className="stat-sub">{stats.users} ผู้ใช้</p>
              </div>
            </section>
          )
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <section className="orders-section">
            <h2 className="section-title">รายการ Order ล่าสุด</h2>

            {ordersLoading ? (
              <p className="loading-text">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="empty-text">ยังไม่มี Order</p>
            ) : (
              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>ลูกค้า</th>
                      <th>รายการ</th>
                      <th>ยอดรวม</th>
                      <th>สถานะ</th>
                      <th>เวลา</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.order_id}>
                        <td className="order-id-cell">#{order.order_id}</td>
                        <td>{order.user_name || order.username}</td>
                        <td className="items-cell">
                          {order.items.map(i => `${i.product_name} x${i.quantity}`).join(', ')}
                        </td>
                        <td className="price-cell">฿{Number(order.total_amount).toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="time-cell">{formatDateTime(order.created_at)}</td>
                        <td>
                          <button
                            type="button"
                            className="detail-button"
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

        {/* Products Tab */}
        {tab === 'products' && (
          <section className="products-section">
            <div className="section-header">
              <h2 className="section-title">รายการสินค้า</h2>
              <button
                type="button"
                className="add-button"
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
              <p className="loading-text">Loading...</p>
            ) : products.length === 0 ? (
              <p className="empty-text">ยังไม่มีสินค้า</p>
            ) : (
              <div className="orders-table-wrap">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>ชื่อสินค้า</th>
                      <th>ราคา</th>
                      <th>หมวดหมู่</th>
                      <th>สถานะ</th>
                      <th>การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const category = categories.find(c => c.category_id === product.category_id)
                      return (
                        <tr key={product.product_id}>
                          <td className="order-id-cell">{product.product_id}</td>
                          <td>{product.name}</td>
                          <td className="price-cell">฿{Number(product.price).toFixed(2)}</td>
                          <td>{category ? category.name : '-'}</td>
                          <td>
                            <span className={`status-badge ${product.is_available ? 'status-completed' : 'status-cancelled'}`}>
                              {product.is_available ? 'เปิดขาย' : 'ปิดขาย'}
                            </span>
                          </td>
                           <td className="actions-cell">
                            <button
                              type="button"
                              className="detail-button"
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
                              className="detail-button cancel-button"
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
                              className={`detail-button ${product.is_available ? 'cancel-button' : 'complete-button'}`}
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

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Order #{selectedOrder.order_id}</h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setSelectedOrder(null)}
                  title="ปิด"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-info-row">
                  <span className="modal-label">ลูกค้า</span>
                  <span>{selectedOrder.user_name || selectedOrder.username}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-label">วันที่</span>
                  <span>{formatDateTime(selectedOrder.created_at)}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-label">สถานะ</span>
                  <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>

                <h4 className="modal-subtitle">รายการสินค้า</h4>
                <div className="modal-items">
                  {selectedOrder.items.map(item => (
                    <div key={item.order_item_id || item.product_id} className="modal-item">
                      <span className="modal-item-name">{item.product_name}</span>
                      <span className="modal-item-qty">x{item.quantity}</span>
                      <span className="modal-item-price">฿{Number(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="modal-total">
                  <span>ยอดรวม</span>
                  <span className="modal-total-price">฿{Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>

                <div className="modal-status-actions">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="status-action-button preparing-button"
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
                        className="status-action-button cancel-button"
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
                      className="status-action-button complete-button"
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

        {/* Product Form Modal */}
        {showProductForm && (
          <div className="modal-overlay" onClick={closeProductForm}>
            <div className="modal-card modal-card-form" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                </h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeProductForm}
                  title="ปิด"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="modal-body">
                {formError && (
                  <p className="order-error" role="alert">{formError}</p>
                )}

                <div className="form-field">
                  <label htmlFor="form-name">ชื่อสินค้า *</label>
                  <input
                    id="form-name"
                    type="text"
                    placeholder="กรอกชื่อสินค้า"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="form-price">ราคา (฿) *</label>
                  <input
                    id="form-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="กรอกราคา"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="form-category">หมวดหมู่ *</label>
                  <select
                    id="form-category"
                    value={formCategoryId}
                    onChange={e => setFormCategoryId(e.target.value)}
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="form-description">รายละเอียด</label>
                  <textarea
                    id="form-description"
                    placeholder="กรอกรายละเอียดสินค้า"
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="form-image">รูปภาพ (URL)</label>
                  <input
                    id="form-image"
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={formImage}
                    onChange={e => setFormImage(e.target.value)}
                  />
                </div>

                <div className="modal-status-actions">
                  <button
                    type="button"
                    className="status-action-button complete-button"
                    onClick={saveProduct}
                    disabled={formLoading}
                    title="บันทึก"
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
                  </button>
                  <button
                    type="button"
                    className="status-action-button cancel-button"
                    onClick={closeProductForm}
                    title="ยกเลิก"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
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
