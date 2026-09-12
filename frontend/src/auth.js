const MOCK_USERS = [
  { username: 'staff', password: 'staff123', role: 'staff', name: 'Staff' },
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin' },
]

/**
 * Stub authentication — will be replaced by the backend auth API later.
 * Returns a sanitized user object, or null when credentials don't match.
 */
export function authenticate(username, password) {
  const user = MOCK_USERS.find(
    (u) => u.username === username.trim() && u.password === password,
  )
  return user
    ? { username: user.username, role: user.role, name: user.name }
    : null
}