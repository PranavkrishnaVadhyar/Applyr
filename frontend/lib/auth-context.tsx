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
  logout: () => Promise<void>
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
      const response = await apiClient.get<User>('/api/auth/me')
      // Note: Backend might return "first_name" and "last_name", adjust if user type fails validation later
      setUser(response as unknown as User)
      setError(null)
    } catch (err) {
      throw err
    }
  }

  const login = async (email: string, password: string) => {
    setError(null)
    try {
      const response = await apiClient.post<{ access_token: string; refresh_token: string; user_id: string; user: User }>('/api/auth/signin', {
        email,
        password,
      })

      localStorage.setItem('authToken', response.access_token)
      if (response.refresh_token) {
        localStorage.setItem('refreshToken', response.refresh_token)
      }
      
      // Update global user state (assuming signin backend response structure /me is fetched separately)
      await refreshUserData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setError(null)
    try {
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ' // minimal placeholder if no last name

      const response = await apiClient.post<{ message: string; user_id: string }>('/api/auth/signup', {
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        role: "user"
      })

      // Backend signup does not directly return the session token right now.
      // Automatically log the user in to get the token.
      await login(email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
      throw err
    }
  }

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout', {})
    } catch (err) {
      console.error('Logout error:', err instanceof Error ? err.message : err)
    } finally {
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setError(null)
    }
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
