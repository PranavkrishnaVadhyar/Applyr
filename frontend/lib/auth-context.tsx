'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { apiClient, ApiError, clearSession, saveSession, SessionTokens } from './api-client'

export interface User {
  id: string
  email: string
  name: string
  first_name?: string | null
  last_name?: string | null
  subscription_tier?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userRequest = useRef(0)

  const refreshUser = useCallback(async () => {
    const request = ++userRequest.current
    const response = await apiClient.get<User>('/api/auth/me')
    if (!localStorage.getItem('authToken') || request !== userRequest.current) return
    setUser({ ...response, name: [response.first_name, response.last_name].filter(Boolean).join(' ') })
    setError(null)
  }, [])

  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      try {
        if (localStorage.getItem('authToken') || localStorage.getItem('refreshToken')) await refreshUser()
        else setUser(null)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) clearSession()
        else setError(err instanceof Error ? err.message : 'Unable to load your account')
      } finally { setLoading(false) }
    }
    const signedOut = () => { ++userRequest.current; setUser(null); setError(null) }
    const storageChanged = (event: StorageEvent) => {
      if (event.key === 'authToken' || event.key === null) void initialize()
    }
    window.addEventListener('auth:logout', signedOut)
    window.addEventListener('storage', storageChanged)
    void initialize()
    return () => {
      window.removeEventListener('auth:logout', signedOut)
      window.removeEventListener('storage', storageChanged)
    }
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    setError(null)
    const session = await apiClient.post<SessionTokens>('/api/auth/signin', { email, password })
    saveSession(session)
    await refreshUser()
  }

  const register = async (email: string, password: string, name: string) => {
    setError(null)
    const [first_name, ...rest] = name.trim().split(/\s+/)
    const result = await apiClient.post<SessionTokens & { requires_email_confirmation: boolean }>('/api/auth/signup', {
      email, password, first_name, last_name: rest.join(' '),
    })
    if (result.requires_email_confirmation) return false
    saveSession(result)
    await refreshUser()
    return true
  }

  const logout = async () => {
    try { await apiClient.post('/api/auth/logout', {}) }
    catch { console.error('Remote sign-out failed; the local session was cleared.') }
    finally { clearSession() }
  }

  return <AuthContext.Provider value={{ user, loading, error, isAuthenticated: !!user, login, register, logout, refreshUser }}>
    {children}
  </AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
