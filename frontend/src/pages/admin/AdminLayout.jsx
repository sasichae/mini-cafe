import { NavLink, Outlet } from 'react-router-dom'

function NavIcon({ children }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const navItems = [
  {
    to: '/admin',
    end: true,
    label: 'Dashboard',
    icon: (
      <NavIcon>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </NavIcon>
    )
  },
  {
    to: '/admin/orders',
    label: 'ออเดอร์',
    icon: (
      <NavIcon>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="m9 14 2 2 4-4" />
      </NavIcon>
    )
  },
  {
    to: '/admin/products',
    label: 'สินค้า',
    icon: (
      <NavIcon>
        <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
        <circle cx="7" cy="7" r="1.2" />
      </NavIcon>
    )
  }
]

export default function AdminLayout({ user, onLogout }) {
  return (
    <div className="h-full flex flex-col bg-cream">
      <div className="flex-1 flex min-h-0">
        <nav className="flex-shrink-0 flex flex-col w-[260px] bg-espresso" aria-label="Admin">
          <div className="px-6 py-6">
            <p className="m-0 font-display text-xl text-cream">Mini Café</p>
            <p className="m-0 mt-0.5 text-xs text-cream/60">ระบบจัดการร้านกาแฟ</p>
          </div>

          <ul className="flex-1 space-y-1 px-3 list-none m-0 p-0">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `flex items-center gap-3 w-full rounded-md px-3 py-2.5 border-none text-sm text-left cursor-pointer transition-colors ${isActive ? 'bg-espresso-soft text-cream font-medium' : 'bg-transparent text-cream/75 hover:bg-espresso-soft/50 hover:text-cream'}`}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="border-t border-cream/15 px-5 py-5">
            <p className="m-0 text-sm font-medium text-cream">{user.username}</p>
            <p className="m-0 text-xs uppercase tracking-wide text-cream/55">{user.role}</p>
            <button
              type="button"
              className="mt-3 flex items-center gap-2 border-none bg-transparent text-sm text-cream/70 cursor-pointer transition-colors hover:text-cream"
              onClick={onLogout}
              title="ออกจากระบบ"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </nav>

        <main className="flex-1 min-w-0 flex flex-col gap-6 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
