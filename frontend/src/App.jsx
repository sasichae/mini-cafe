import { useEffect, useState } from 'react'
import Login from './Login'
import Register from './Register'
import Order from './Order'
import AdminDashboard from './AdminDashboard'
import './App.css'

const SESSION_KEY = 'mini-cafe-session'

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function App() {
  const [user, setUser] = useState(loadSession)
  const [view, setView] = useState('login')

  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [user])

  if (!user) {
    if (view === 'register') {
      return <Register onBackToLogin={() => setView('login')} />
    }
    return <Login onLogin={setUser} onShowRegister={() => setView('register')} />
  }

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={() => setUser(null)} />
  }

  return <Order user={user} onLogout={() => setUser(null)} />
}