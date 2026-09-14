import { useState, useEffect } from 'react'

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

  const token = localStorage.getItem('mini-cafe-token')

  useEffect(() => {
    fetchStats()
    fetchOrders()
    fetchProducts()
    fetchCategories()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('http://localhost:3001/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch {
      setError('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch('http://localhost:3001/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } catch {
      setError('ไม่สามารถโหลดรายการ Order ได้')
    } finally {
      setOrdersLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      setProductsLoading(true)
      const res = await fetch('http://localhost:3001/api/products?show_all=true', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch {
      setError('ไม่สามารถโหลดรายการสินค้าได้')
    } finally {
      setProductsLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch('http://localhost:3001/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setCategories(data.data)
    } catch {
      setCategories([])
    }
  }

  async function toggleAvailability(productId, currentStatus) {
    try {
      const res = await fetch(`http://localhost:3001/api/products/${productId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
        setSuccess(data.message)
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch {
      setError('ไม่สามารถเปลี่ยนสถานะสินค้าได้')
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
        ? `http://localhost:3001/api/products/${editingProduct.product_id}`
        : 'http://localhost:3001/api/products'

      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!data.success) {
        setFormError(data.message)
        setFormLoading(false)
        return
      }

      setSuccess(data.message)
      setTimeout(() => setSuccess(''), 2000)
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
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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
      setError('ไม่สามารถอัปเดตสถานะได้')
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
          <button type="button" className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${tab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          Orders
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'products' ? 'active' : ''}`}
          onClick={() => setTab('products')}
        >
          Products
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
                <p className="stat-sub">฿{stats.revenue.today}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Orders ทั้งหมด</p>
                <p className="stat-value">{stats.orders.total}</p>
                <p className="stat-sub">฿{stats.revenue.total}</p>
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
                        <td className="price-cell">฿{order.total_amount}</td>
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
                          >
                            ดูรายละเอียด
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
              >
                + เพิ่มสินค้า
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
                          <td className="price-cell">฿{product.price}</td>
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
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              className={`detail-button ${product.is_available ? 'cancel-button' : 'complete-button'}`}
                              onClick={() => toggleAvailability(product.product_id, product.is_available)}
                            >
                              {product.is_available ? 'ปิดขาย' : 'เปิดขาย'}
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
                >
                  x
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
                      <span className="modal-item-price">฿{item.total}</span>
                    </div>
                  ))}
                </div>

                <div className="modal-total">
                  <span>ยอดรวม</span>
                  <span className="modal-total-price">฿{selectedOrder.total_amount}</span>
                </div>

                <div className="modal-status-actions">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        className="status-action-button preparing-button"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'preparing')}
                      >
                        เริ่มเตรียม
                      </button>
                      <button
                        type="button"
                        className="status-action-button cancel-button"
                        onClick={() => updateOrderStatus(selectedOrder.order_id, 'cancelled')}
                      >
                        ยกเลิก
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button
                      type="button"
                      className="status-action-button complete-button"
                      onClick={() => updateOrderStatus(selectedOrder.order_id, 'completed')}
                    >
                      เสร็จสิ้น
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
                >
                  x
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
                  >
                    {formLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                  <button
                    type="button"
                    className="status-action-button cancel-button"
                    onClick={closeProductForm}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
