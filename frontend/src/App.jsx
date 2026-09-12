import { useEffect, useState } from 'react'
import Login from './Login'
import Order from './Order'
import AdminDashboard from './AdminDashboard'
import './App.css'

const SESSION_KEY = 'mini-cafe-session'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    // Corrupted session storage — treat as logged out.
    return null
  }
}

export default function App() {
  const [user, setUser] = useState(loadSession)

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [user])

  if (!user) {
    return <Login onLogin={setUser} />
  }

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={() => setUser(null)} />
  }

  return <Order user={user} onLogout={() => setUser(null)} />
}