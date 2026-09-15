import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../lib/api'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [productsLoading, setProductsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef(null)
  const [productSearch, setProductSearch] = useState('')

  function showError(msg) {
    setError(msg)
    setTimeout(() => setError(''), 2000)
  }

  function showSuccess(msg) {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 2000)
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false)
      }
    }
    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [categoryDropdownOpen])

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

  return (
    <>
      {error && (
        <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-error-bg text-error text-[13px] font-semibold text-center" role="alert">{error}</p>
      )}
      {success && (
        <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-[#EAFAF1] text-[#2ECC71] text-[13px] font-semibold text-center" role="status">{success}</p>
      )}

      <section className="flex flex-col gap-3">
        {/* Top bar */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="m-0 font-display text-[28px] font-semibold text-espresso leading-tight">รายการสินค้า</h2>
            <p className="m-0 mt-1 text-sm text-mocha/80">ดูและจัดการเมนูเครื่องดื่มทั้งหมดของร้าน</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="py-2 pl-8 pr-3 border border-border rounded-full bg-white text-espresso text-sm transition-colors focus:outline-none focus:border-caramel focus:shadow-[0_0_0_3px_rgba(200,135,63,0.15)] w-[220px]"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha/50 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 py-2 px-4 border-none rounded-full bg-caramel text-white text-sm font-semibold cursor-pointer hover:bg-[#a06b2f] active:scale-[0.98] transition-all whitespace-nowrap"
              onClick={openAddProductForm}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              เพิ่มสินค้า
            </button>
          </div>
        </div>

        {productsLoading ? (
          <p className="col-span-full text-center py-10 text-mocha">Loading...</p>
        ) : products.length === 0 ? (
          <p className="col-span-full text-center py-10 text-mocha">ยังไม่มีสินค้า</p>
        ) : products.filter(product => {
            if (!productSearch.trim()) return true
            const query = productSearch.toLowerCase()
            const category = categories.find(c => c.category_id === product.category_id)
            return (
              product.name.toLowerCase().includes(query) ||
              (category && category.name.toLowerCase().includes(query))
            )
          }).length === 0 ? (
          <p className="col-span-full text-center py-10 text-mocha">ไม่พบสินค้าที่ค้นหา</p>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <colgroup>
                  <col className="w-[5%]" />
                  <col className="w-[6%]" />
                  <col className="w-[28%]" />
                  <col className="w-[14%]" />
                  <col className="w-[17%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead>
                  <tr className="bg-gradient-to-r from-[#f6efe6] to-[#faf3e7] text-[13px] text-mocha/70">
                    <th className="px-3 py-3 text-center font-semibold">#</th>
                    <th className="px-2 py-3 text-center font-semibold">รูป</th>
                    <th className="px-3 py-3 text-left font-semibold">ชื่อสินค้า</th>
                    <th className="px-3 py-3 text-right font-semibold">ราคา</th>
                    <th className="px-3 py-3 text-left font-semibold">หมวดหมู่</th>
                    <th className="px-3 py-3 text-center font-semibold">สถานะ</th>
                    <th className="px-3 py-3 text-center font-semibold">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(product => {
                    if (!productSearch.trim()) return true
                    const query = productSearch.toLowerCase()
                    const category = categories.find(c => c.category_id === product.category_id)
                    return (
                      product.name.toLowerCase().includes(query) ||
                      (category && category.name.toLowerCase().includes(query))
                    )
                  }).map((product, index) => {
                    const category = categories.find(c => c.category_id === product.category_id)
                    return (
                      <tr key={product.product_id} className="border-t border-border/40 transition hover:bg-cream/20">
                        <td className="px-3 py-3 text-[13.5px] text-mocha/70 text-center tabular-nums">{index + 1}</td>
                        <td className="px-2 py-3">
                          <div className="flex justify-center">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover border border-border/50" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-deep/60 text-mocha/30">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[13.5px] font-semibold text-espresso text-left">{product.name}</td>
                        <td className="px-3 py-3 text-[13.5px] font-semibold text-espresso text-right tabular-nums">฿{Number(product.price).toFixed(2)}</td>
                        <td className="px-3 py-3 text-left">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/80 px-2.5 py-0.5 text-xs font-medium text-mocha">
                            <span className="h-1.5 w-1.5 rounded-full bg-caramel" />
                            {category ? category.name : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {product.is_available ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAFAF1] px-2.5 py-0.5 text-xs font-medium text-[#2ECC71]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71]" />
                              เปิดขาย
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDEDEC] px-2.5 py-0.5 text-xs font-medium text-[#E74C3C]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#E74C3C]" />
                              ปิดขาย
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-0.5">
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-mocha/60 transition hover:bg-cream hover:text-caramel"
                              onClick={() => openEditProductForm(product)}
                              title="แก้ไข"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-mocha/60 transition hover:bg-[#FDEDEC] hover:text-[#E74C3C]"
                              onClick={() => deleteProduct(product.product_id)}
                              title="ลบ"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className={`flex h-7 w-7 items-center justify-center rounded-md text-mocha/60 transition ${product.is_available ? 'hover:bg-[#FEF3E2] hover:text-[#F39C12]' : 'hover:bg-[#EAFAF1] hover:text-[#2ECC71]'}`}
                              onClick={() => toggleAvailability(product.product_id, product.is_available)}
                              title={product.is_available ? 'ปิดขาย' : 'เปิดขาย'}
                            >
                              {product.is_available ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                  <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          </div>
        )}
      </section>

      {showProductForm && (
        <div className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center" onClick={closeProductForm}>
          <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between py-5 px-6 border-b border-border rounded-t-2xl">
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

            <div className="flex flex-col gap-4 py-5 px-6 border-x border-b border-border rounded-b-2xl">
              {formError && (
                <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-error-bg text-error text-[13px] font-semibold text-center" role="alert">{formError}</p>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="form-name" className="text-[13px] font-semibold text-mocha">ชื่อสินค้า</label>
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
                <label htmlFor="form-price" className="text-[13px] font-semibold text-mocha">ราคา (฿)</label>
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
                <label className="text-[13px] font-semibold text-mocha">หมวดหมู่</label>
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className={`w-full py-2.5 px-3 pr-10 border-[1.5px] rounded-lg bg-white text-sm text-left cursor-pointer transition-colors focus:outline-none ${categoryDropdownOpen ? 'border-caramel' : 'border-border'} ${formCategoryId ? 'text-espresso' : 'text-mocha/60'}`}
                  >
                    {formCategoryId
                      ? categories.find(c => String(c.category_id) === formCategoryId)?.name || 'เลือกหมวดหมู่'
                      : 'เลือกหมวดหมู่'}
                  </button>
                  <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mocha pointer-events-none transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>

                  {categoryDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-[0_8px_24px_rgba(42,28,19,0.12)] overflow-hidden">
                      {categories.map(cat => (
                        <button
                          key={cat.category_id}
                          type="button"
                          onClick={() => { setFormCategoryId(String(cat.category_id)); setCategoryDropdownOpen(false) }}
                          className={`w-full py-2.5 px-3 text-left text-sm border-none cursor-pointer transition-colors ${String(cat.category_id) === formCategoryId ? 'bg-cream text-espresso font-medium' : 'bg-transparent text-mocha hover:bg-cream/60'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="form-description" className="text-[13px] font-semibold text-mocha">รายละเอียด</label>
                <div className="relative">
                  <textarea
                    id="form-description"
                    placeholder="กรอกรายละเอียดสินค้า"
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-3 border-[1.5px] border-border rounded-lg bg-white text-espresso text-sm transition-colors focus:outline-none focus:border-caramel min-h-[80px] resize-y"
                  />
                  <svg className="absolute left-3 top-3 w-4 h-4 text-mocha/50 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="animate-spin">
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
    </>
  )
}
