export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export interface ApiResponse<T> { data?: T; error?: string; message?: string }

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface SessionTokens { access_token: string; refresh_token: string }

export function saveSession(session: SessionTokens) {
  localStorage.setItem('authToken', session.access_token)
  localStorage.setItem('refreshToken', session.refresh_token)
}

export function clearSession() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('refreshToken')
  window.dispatchEvent(new Event('auth:logout'))
}

async function responseError(response: Response) {
  const data = await response.json().catch(() => ({}))
  const detail = data.detail ?? data.message
  const message = typeof detail === 'string' ? detail
    : Array.isArray(detail) ? detail.map((item: { msg?: string }) => item.msg || 'Invalid input').join('; ')
    : `HTTP ${response.status}`
  return new ApiError(message, response.status, data)
}

let refreshing: Promise<boolean> | null = null

async function refreshSession(staleToken: string | null): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const refresh = async () => {
    // Another tab/request may already have rotated the token.
    const current = localStorage.getItem('authToken')
    if (current && current !== staleToken) return true
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!response.ok) {
      if (response.status === 401) {
        if (localStorage.getItem('refreshToken') === refreshToken) clearSession()
        return false
      }
      throw await responseError(response)
    }
    const session: SessionTokens = await response.json()
    // Do not resurrect a session after logout or replace a newer sign-in.
    if (localStorage.getItem('refreshToken') !== refreshToken) return false
    saveSession(session)
    return true
  }
  if (!refreshing) {
    refreshing = ('locks' in navigator
      ? navigator.locks.request('applyr-session-refresh', refresh)
      : refresh()).finally(() => { refreshing = null })
  }
  return refreshing
}

class ApiClient {
  constructor(private baseUrl: string = API_BASE_URL) {}

  async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
    const publicAuth = ['/api/auth/signin', '/api/auth/signup', '/api/auth/refresh'].includes(endpoint)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const headers = new Headers(options.headers)
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    if (token && !publicAuth) headers.set('Authorization', `Bearer ${token}`)
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers })
      if (response.status === 401 && !publicAuth) {
        if (retry && await refreshSession(token)) return this.request<T>(endpoint, options, false)
        if (typeof window !== 'undefined' && localStorage.getItem('authToken') === token) clearSession()
      }
      if (!response.ok) throw await responseError(response)
      if (response.status === 204) return undefined as T
      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(error instanceof Error ? error.message : 'Network request failed', 0, error)
    }
  }

  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }
  post<T>(endpoint: string, data?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) })
  }
  put<T>(endpoint: string, data?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data === undefined ? undefined : JSON.stringify(data) })
  }
  patch<T>(endpoint: string, data?: unknown, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data === undefined ? undefined : JSON.stringify(data) })
  }
  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}
export const apiClient = new ApiClient()
