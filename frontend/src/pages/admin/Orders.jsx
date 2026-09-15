import { useEffect, useState, useMemo } from 'react'
import { apiFetch } from '../../lib/api'
import { getStatusClass, getStatusLabel, formatDateTime } from './adminUtils'

const STATUS_FILTERS = [
  { key: 'all', label: 'ทั้งหมด', dot: '#6b5240' },
  { key: 'pending', label: 'รอดำเนินการ', dot: '#E67E22' },
  { key: 'preparing', label: 'กำลังเตรียม', dot: '#3498DB' },
  { key: 'completed', label: 'เสร็จสิ้น', dot: '#2ECC71' },
  { key: 'cancelled', label: 'ยกเลิก', dot: '#E74C3C' },
]

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders
    return orders.filter(o => o.status === statusFilter)
  }, [orders, statusFilter])

  function showError(msg) {
    setError(msg)
    setTimeout(() => setError(''), 2000)
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

  useEffect(() => {
    fetchOrders()
  }, [])

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

  return (
    <>
      {error && (
        <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-error-bg text-error text-[13px] font-semibold text-center" role="alert">{error}</p>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="m-0 font-display text-[24px] font-semibold text-espresso leading-tight">รายการ Order ล่าสุด</h2>
            <p className="m-0 mt-1 text-[13px] text-mocha">ทั้งหมด {orders.length} ออเดอร์ · แสดง {filteredOrders.length} รายการ</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium cursor-pointer transition-colors duration-150"
              style={{
                background: statusFilter === f.key ? '#2a1c13' : '#fffdf9',
                color: statusFilter === f.key ? '#f3e7d3' : '#5b4e41',
                border: statusFilter === f.key ? '1px solid #2a1c13' : '1px solid #E4D9C4',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.dot }} />
              {f.label}
            </button>
          ))}
        </div>

        {ordersLoading ? (
          <p className="col-span-full text-center py-10 text-mocha">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="col-span-full text-center py-10 text-mocha">ยังไม่มี Order</p>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: '#FBF7EF', border: '1px solid #E4D9C4' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Order', 'ลูกค้า', 'รายการ', 'ยอดรวม', 'สถานะ', 'เวลา', ''].map((h, i) => (
                    <th key={i} className="px-6 py-3.5 text-center text-[12.5px] font-medium" style={{ color: '#9C8874', borderBottom: '1px solid #E4D9C4' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center text-[13.5px]" style={{ color: '#9C8874' }}>
                      ไม่พบออเดอร์ที่ตรงกับการกรอง
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => (
                    <tr
                      key={order.order_id}
                      className="cursor-pointer transition-colors duration-150"
                      style={{ borderBottom: idx === filteredOrders.length - 1 ? 'none' : '1px solid #EEE5D3' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F3ECDD'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-6 py-4 text-center text-[14px] font-semibold" style={{ color: '#2A211B' }}>#{order.order_id}</td>
                      <td className="px-6 py-4 text-center text-[13.5px]" style={{ color: '#5B4E41' }}>{order.user_name || order.username}</td>
                      <td className="px-6 py-4 text-center text-[13.5px] max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: '#5B4E41' }}>
                        {order.items.map(i => `${i.product_name} x${i.quantity}`).join(', ')}
                      </td>
                      <td className="px-6 py-4 text-center text-[13.5px] font-semibold" style={{ color: '#2A211B' }}>฿{Number(order.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium whitespace-nowrap"
                          style={{
                            background: order.status === 'pending' ? '#FBF1DF' : order.status === 'preparing' ? '#EEF2F6' : order.status === 'completed' ? '#ECF3EA' : '#F7E9E9',
                            color: order.status === 'pending' ? '#8C6A1E' : order.status === 'preparing' ? '#4E6483' : order.status === 'completed' ? '#4B7346' : '#8F4141',
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{
                            background: order.status === 'pending' ? '#C9962B' : order.status === 'preparing' ? '#7B93B0' : order.status === 'completed' ? '#6F9A6A' : '#B85C5C',
                          }} />
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-[13px]" style={{ color: '#8C7C6B' }}>{formatDateTime(order.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-colors"
                          style={{ border: '1px solid #E4D9C4', color: '#5B4E41' }}
                          onClick={() => setSelectedOrder(order)}
                          title="ดูรายละเอียด"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/45 z-[100] p-6" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between py-5 px-6 border-b border-warm-beige">
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

              <h4 className="m-0 text-[15px] font-semibold text-espresso border-t border-warm-beige pt-3">รายการสินค้า</h4>
              <div className="flex flex-col gap-2.5">
                {selectedOrder.items.map(item => (
                  <div key={item.order_item_id || item.product_id} className="flex items-center gap-3 py-2.5 px-3 border border-warm-beige rounded-lg">
                    <span className="flex-1 font-semibold text-espresso">{item.product_name}</span>
                    <span className="text-[13px] text-mocha min-w-[30px] text-center">x{item.quantity}</span>
                    <span className="font-semibold text-caramel min-w-[70px] text-right">฿{Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-warm-beige font-bold text-espresso">
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
                      <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 2v4" />
                          <path d="m4.93 4.93 2.83 2.83" />
                          <path d="M2 12h4" />
                          <path d="m19.07 4.93-2.83 2.83" />
                          <path d="M22 12h-4" />
                          <circle cx="12" cy="12" r="4" />
                        </svg>
                        เริ่มเตรียม
                      </span>
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-2.5 px-0 border-none rounded-lg bg-[#E74C3C] text-white text-sm font-bold cursor-pointer transition-opacity hover:opacity-85"
                      onClick={() => updateOrderStatus(selectedOrder.order_id, 'cancelled')}
                      title="ยกเลิก"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        ยกเลิก
                      </span>
                    </button>
                  </>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button
                    type="button"
                    className="flex-1 py-2.5 px-0 border-none rounded-lg bg-[#2ECC71] text-white text-sm font-bold cursor-pointer transition-opacity hover:opacity-85"
                    onClick={() => updateOrderStatus(selectedOrder.order_id, 'completed')}
                    title="ยืนยัน"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      ยืนยัน
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
