'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from './api-client'

export interface User {
  id: string
  email: string
  name: string
  subscription_tier?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize user from token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          await refreshUserData()
        }
      } catch (err) {
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const refreshUserData = async () => {
    try {
      const response = await apiClient.get<User>('/auth/me')
      setUser(response)
      setError(null)
    } catch (err) {
      throw err
    }
  }

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const response = await apiClient.post<{ access_token: string; user: User }>('/auth/login', {
        email,
        password,
      })

      localStorage.setItem('authToken', response.access_token)
      setUser(response.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setError(null)
    try {
      const response = await apiClient.post<{ access_token: string; user: User }>('/auth/register', {
        email,
        password,
        name,
      })

      localStorage.setItem('authToken', response.access_token)
      setUser(response.user)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setError(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser: refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
