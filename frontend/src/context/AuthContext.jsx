import { createContext, useContext, useState, useEffect } from "react";
import { getMe, loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    if (token) {
      getMe()
        .then((data) => { if (!cancelled) setUser(data); })
        .catch(() => { if (!cancelled) localStorage.removeItem("token"); })
        .finally(() => { if (!cancelled) setLoading(false); });
    } else {
      Promise.resolve().then(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, []);

  async function login(username, password) {
    const data = await loginUser(username, password);
    if (!data?.token) throw new Error("ไม่ได้รับ token จากเซิร์ฟเวอร์");
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  }

  async function register(username, email, password) {
    const data = await registerUser(username, email, password);
    if (!data?.token) throw new Error("ไม่ได้รับ token จากเซิร์ฟเวอร์");
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
