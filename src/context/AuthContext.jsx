import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import api, { setSessionExpiredHandler } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true until the initial /auth/me check resolves — prevents a redirect flicker
  const [isLoading, setIsLoading] = useState(true)
  const logoutRef = useRef(null)

  const logout = useCallback(async (callApi = true) => {
    if (callApi) {
      try {
        await api.post('/auth/logout')
      } catch {
        // Ignore — the cookie will be cleared by the backend response
      }
    }
    setUser(null)
  }, [])

  // Give the Axios interceptor a stable, closure-free reference to logout
  useEffect(() => {
    logoutRef.current = () => logout(false)
    setSessionExpiredHandler(() => logoutRef.current?.())
  }, [logout])

  // Restore session on mount — backend validates the HttpOnly cookie
  useEffect(() => {
    let cancelled = false
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!cancelled) setUser(data)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    setUser(data.user)
    return data
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
