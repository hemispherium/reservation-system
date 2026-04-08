import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import client from '../api/client'
import { authApi, type AuthUser } from '../api/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  register: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setLoading(false)
      return
    }
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('auth_token')
        delete client.defaults.headers.common['Authorization']
      })
      .finally(() => setLoading(false))
  }, [])

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password)
    const { token, user } = res.data
    localStorage.setItem('auth_token', token)
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const { token, user } = res.data
    localStorage.setItem('auth_token', token)
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
  }

  const logout = async () => {
    await authApi.logout().catch(() => {})
    localStorage.removeItem('auth_token')
    delete client.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
