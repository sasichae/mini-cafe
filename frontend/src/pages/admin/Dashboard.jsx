import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { getStatusClass, getStatusLabel } from './adminUtils'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function showError(msg) {
    setError(msg)
    setTimeout(() => setError(''), 2000)
  }

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
    }
  }

  useEffect(() => {
    fetchStats()
    fetchOrders()
  }, [])

  if (loading) {
    return <p className="col-span-full text-center py-10 text-mocha">Loading...</p>
  }

  if (!stats) return null

  const now = new Date()
  const hourNow = now.getHours()
  const greeting = hourNow < 12 ? 'สวัสดีตอนเช้า' : hourNow < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'
  const dateLabel = `${now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} · ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`

  const statusItems = [
    { label: 'รอดำเนินการ', count: stats.status.pending || 0, color: '#E67E22' },
    { label: 'กำลังเตรียม', count: stats.status.preparing || 0, color: '#3498DB' },
    { label: 'เสร็จสิ้น', count: stats.status.completed || 0, color: '#2ECC71' },
    { label: 'ยกเลิก', count: stats.status.cancelled || 0, color: '#E74C3C' }
  ]
  const statusTotal = statusItems.reduce((sum, s) => sum + s.count, 0) || 1

  const dayBuckets = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    dayBuckets.push({
      key: d.toDateString(),
      label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      count: 0
    })
  }
  const dayIndex = {}
  dayBuckets.forEach((b, i) => { dayIndex[b.key] = i })
  orders.forEach(o => {
    const d = new Date(o.created_at)
    const idx = dayIndex[d.toDateString()]
    if (idx !== undefined) dayBuckets[idx].count += 1
  })
  const maxDayCount = Math.max(1, ...dayBuckets.map(b => b.count))
  const hasDayData = dayBuckets.some(b => b.count > 0)

  const productTally = {}
  orders.forEach(o => (o.items || []).forEach(it => {
    const name = it.product_name || '-'
    productTally[name] = (productTally[name] || 0) + (it.quantity || 0)
  }))
  const topProducts = Object.entries(productTally).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const recentOrders = orders.slice(0, 4)

  return (
    <>
      {error && (
        <p className="m-0 mb-3 px-3 py-2.5 rounded-lg bg-error-bg text-error text-[13px] font-semibold text-center" role="alert">{error}</p>
      )}

      <div className="flex flex-col gap-5">
        {/* Top bar */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="m-0 font-display text-[28px] font-semibold text-espresso leading-tight">{greeting}</h2>
            <p className="m-0 mt-1 text-sm text-mocha/80">ภาพรวมร้านของวันนี้</p>
          </div>
          <div className="whitespace-nowrap rounded-xl border border-border bg-white px-4 py-2 text-[13.5px] text-mocha">{dateLabel}</div>
        </div>

        {/* Hero + status stat cards */}
        <section className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-espresso px-6 py-6">
            <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(200,135,63,0.55),transparent_70%)]" />
            <p className="relative m-0 mb-2.5 text-[13px] text-cream/60">ยอดขายทั้งหมด</p>
            <p className="relative m-0 mb-1.5 font-display text-[38px] font-bold leading-none text-white">฿{Number(stats.revenue.total).toFixed(2)}</p>
            <p className="relative m-0 text-[13px] text-caramel-light">฿{Number(stats.revenue.today).toFixed(2)} วันนี้</p>
          </div>
          {[
            {
              label: 'รอดำเนินการ',
              value: stats.status.pending,
              chip: 'bg-[#FEF3E2] text-[#E67E22]',
              foot: 'ออเดอร์รอดำเนินการ',
              icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              )
            },
            {
              label: 'กำลังเตรียม',
              value: stats.status.preparing,
              chip: 'bg-[#EBF5FB] text-[#3498DB]',
              foot: 'กำลังเตรียมเครื่องดื่ม',
              icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              )
            },
            {
              label: 'เสร็จสิ้น',
              value: stats.status.completed,
              chip: 'bg-[#EAFAF1] text-[#2ECC71]',
              foot: `จากทั้งหมด ${stats.orders.total} ออเดอร์`,
              icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )
            }
          ].map(card => (
            <div key={card.label} className="flex flex-col gap-2.5 rounded-2xl border border-border bg-white px-5 py-5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-mocha">{card.label}</span>
                <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg ${card.chip}`}>{card.icon}</span>
              </div>
              <span className="font-display text-[28px] font-bold leading-none text-espresso">{card.value}</span>
              <span className="text-[12.5px] text-mocha/70">{card.foot}</span>
            </div>
          ))}
        </section>

        {/* Secondary stat strip */}
        <section className="grid grid-cols-4 gap-4">
          {[
            { label: 'ออเดอร์วันนี้', value: stats.orders.today },
            { label: 'ออเดอร์ทั้งหมด', value: stats.orders.total },
            { label: 'สินค้าในร้าน', value: stats.products.total },
            { label: 'ผู้ใช้งาน', value: stats.users }
          ].map(card => (
            <div key={card.label} className="flex items-center justify-between rounded-2xl border border-border bg-white px-5 py-3.5">
              <span className="text-[13px] text-mocha">{card.label}</span>
              <span className="font-display text-[20px] font-bold text-espresso">{card.value}</span>
            </div>
          ))}
        </section>

        {/* Last 7 days chart + order status */}
        <section className="grid grid-cols-[1.6fr_1fr] items-stretch gap-4">
          <div className="rounded-2xl border border-border bg-white px-6 py-5">
            <h3 className="m-0 mb-4 text-[16px] font-semibold text-espresso">ออเดอร์ 7 วันล่าสุด</h3>
            {!hasDayData ? (
              <p className="m-0 py-14 text-center text-[13px] text-mocha/60">ยังไม่มีออเดอร์</p>
            ) : (
              <div className="flex h-[170px] items-end gap-3">
                {dayBuckets.map((b, i) => {
                  const pct = Math.round((b.count / maxDayCount) * 100)
                  const isLast = i === dayBuckets.length - 1
                  return (
                    <div key={b.key} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-[140px] w-full items-end justify-center">
                        <div className={`w-full max-w-[34px] rounded-t-md ${isLast ? 'bg-caramel' : 'bg-cream-deep'}`} style={{ height: `${Math.max(pct, b.count ? 8 : 3)}%` }} />
                      </div>
                      <span className="text-[11.5px] text-mocha/70">{b.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white px-6 py-5">
            <h3 className="m-0 mb-4 text-[16px] font-semibold text-espresso">สถานะออเดอร์</h3>
            <div className="flex flex-col gap-4">
              {statusItems.map(s => (
                <div key={s.label}>
                  <div className="mb-1.5 flex items-center gap-3">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 text-[13.5px] text-espresso">{s.label}</span>
                    <span className="text-[13.5px] font-bold text-espresso">{s.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-cream-deep">
                    <div className="h-full rounded" style={{ width: `${Math.round((s.count / statusTotal) * 100)}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent orders + top products */}
        <section className="grid grid-cols-[1.6fr_1fr] items-stretch gap-4">
          <div className="rounded-2xl border border-border bg-white px-6 py-5">
            <h3 className="m-0 mb-3 text-[16px] font-semibold text-espresso">ออเดอร์ล่าสุด</h3>
            {recentOrders.length === 0 ? (
              <p className="m-0 py-10 text-center text-[13px] text-mocha/60">ยังไม่มีออเดอร์</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-border px-2.5 pb-2.5 text-left text-[12px] font-semibold text-mocha/70">ออเดอร์</th>
                    <th className="border-b border-border px-2.5 pb-2.5 text-left text-[12px] font-semibold text-mocha/70">รายการ</th>
                    <th className="border-b border-border px-2.5 pb-2.5 text-left text-[12px] font-semibold text-mocha/70">ยอด</th>
                    <th className="border-b border-border px-2.5 pb-2.5 text-left text-[12px] font-semibold text-mocha/70">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.order_id}>
                      <td className="border-b border-border/60 px-2.5 py-3 text-[13.5px] font-semibold text-caramel">#{o.order_id}</td>
                      <td className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap border-b border-border/60 px-2.5 py-3 text-[12.5px] text-mocha">{(o.items || []).map(i => `${i.product_name} x${i.quantity}`).join(', ')}</td>
                      <td className="whitespace-nowrap border-b border-border/60 px-2.5 py-3 text-[13.5px] font-semibold text-espresso">฿{Number(o.total_amount).toFixed(2)}</td>
                      <td className="border-b border-border/60 px-2.5 py-3">
                        <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold ${getStatusClass(o.status)}`}>{getStatusLabel(o.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white px-6 py-5">
            <h3 className="m-0 mb-2 text-[16px] font-semibold text-espresso">สินค้าขายดี</h3>
            {topProducts.length === 0 ? (
              <p className="m-0 py-10 text-center text-[13px] text-mocha/60">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="flex flex-col">
                {topProducts.map(([name, qty], idx) => (
                  <div key={name} className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-b-0">
                    <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg bg-cream-deep text-[12px] font-bold text-caramel">{idx + 1}</span>
                    <span className="flex-1 text-[13.5px] text-espresso">{name}</span>
                    <span className="text-[13px] text-mocha">{qty} แก้ว</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
