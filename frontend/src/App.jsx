import { useEffect, useState } from 'react'
import Login from './Login'
import Register from './Register'
import Order from './Order'
import AdminDashboard from './AdminDashboard'
import { SESSION_KEY, UNAUTHORIZED_EVENT } from './api'
import './App.css'

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

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
      setView('login')
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

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