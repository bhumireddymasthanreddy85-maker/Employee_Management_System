import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../api/services'
import { AUTH_EXPIRED_EVENT } from './authEvents'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const getStoredUser = () => {
  const rawUser = localStorage.getItem('employee_user')
  return rawUser ? (JSON.parse(rawUser) as AuthUser) : null
}

const getStoredToken = () => localStorage.getItem('employee_token')

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authService.login(email, password)
      localStorage.setItem('employee_token', response.access_token)
      localStorage.setItem('employee_user', JSON.stringify(response.user))
      setToken(response.access_token)
      setUser(response.user)
      setSessionExpired(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authService.changePassword(currentPassword, newPassword)
    setUser((currentUser) => {
      if (!currentUser) return currentUser
      const updatedUser = { ...currentUser, must_change_password: false }
      localStorage.setItem('employee_user', JSON.stringify(updatedUser))
      return updatedUser
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('employee_token')
    localStorage.removeItem('employee_user')
    setToken(null)
    setUser(null)
    setSessionExpired(false)
  }, [])

  const expireSession = useCallback(() => {
    localStorage.removeItem('employee_token')
    localStorage.removeItem('employee_user')
    setToken(null)
    setUser(null)
    setSessionExpired(true)
  }, [])

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession)
  }, [expireSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      sessionExpired,
      login,
      changePassword,
      logout,
    }),
    [login, changePassword, logout, token, user, isLoading, sessionExpired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
