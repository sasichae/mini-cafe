const TOKEN_KEY = 'mini-cafe-token'

export const SESSION_KEY = 'mini-cafe-session'

export const UNAUTHORIZED_EVENT = 'mini-cafe:unauthorized'

export const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Shared fetch wrapper.
 *
 * Attaches the Bearer token when present. A 401 is treated as an expired
 * session ONLY when a token was sent — login/register requests (no token)
 * keep their own 401 so wrong-credential messages still work.
 */
export async function apiFetch(path, options = {}) {
  const token = getToken()

  const headers = { ...options.headers }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && token) {
    clearSession()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new Error('UNAUTHORIZED')
  }

  return res
}
