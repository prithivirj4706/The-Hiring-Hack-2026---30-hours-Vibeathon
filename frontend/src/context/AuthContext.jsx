import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearToken, getToken } from '../services/api'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore the session from a stored token on first load.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    authService
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const loggedIn = await authService.login(email, password)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(async (payload) => {
    const registered = await authService.register(payload)
    setUser(registered)
    return registered
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}

export const HOME_BY_ROLE = {
  student: '/student',
  recruiter: '/recruiter',
  admin: '/admin',
}
