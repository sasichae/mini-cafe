import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { getStatusClass, getStatusLabel, formatDateTime } from './adminUtils'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [error, setError] = useState('')

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
          <h2 className="m-0 text-lg font-semibold text-espresso">รายการ Order ล่าสุด</h2>
        </div>

        {ordersLoading ? (
          <p className="col-span-full text-center py-10 text-mocha">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="col-span-full text-center py-10 text-mocha">ยังไม่มี Order</p>
        ) : (
          <div className="overflow-x-auto border border-warm-beige rounded-xl bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-warm-beige whitespace-nowrap">Order</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-warm-beige whitespace-nowrap">ลูกค้า</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-warm-beige whitespace-nowrap">รายการ</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-warm-beige whitespace-nowrap">ยอดรวม</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-warm-beige whitespace-nowrap">สถานะ</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-warm-beige whitespace-nowrap">เวลา</th>
                  <th className="px-4 py-3.5 text-center font-semibold text-mocha bg-cream border-b border-warm-beige whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.order_id} className="hover:bg-cream">
                    <td className="px-4 py-3 border-b border-warm-beige text-espresso align-middle font-bold text-caramel whitespace-nowrap text-center">#{order.order_id}</td>
                    <td className="px-4 py-3 border-b border-warm-beige text-espresso align-middle text-center">{order.user_name || order.username}</td>
                    <td className="px-4 py-3 border-b border-warm-beige text-espresso align-middle max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap text-mocha text-[13px] text-center">
                      {order.items.map(i => `${i.product_name} x${i.quantity}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 border-b border-warm-beige text-espresso align-middle font-semibold whitespace-nowrap text-center">฿{Number(order.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-3 border-b border-warm-beige text-espresso align-middle text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-warm-beige text-espresso align-middle whitespace-nowrap text-[13px] text-mocha text-center">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3 border-b border-warm-beige text-espresso align-middle text-center">
                      <button
                        type="button"
                        className="px-3 py-1.5 border-[1.5px] border-warm-beige rounded-md bg-transparent text-espresso text-[13px] font-semibold cursor-pointer whitespace-nowrap transition-all hover:border-caramel hover:text-caramel"
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
    </>
  )
}
