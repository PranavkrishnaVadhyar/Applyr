import { apiClient } from './api-client'

export interface UserProfile {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role?: string | null
  active: boolean
  phone_number?: string | null
  location?: string | null
  headline?: string | null
  bio?: string | null
  skills?: string[] | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UserProfileUpdate {
  first_name?: string | null
  last_name?: string | null
  phone_number?: string | null
  location?: string | null
  headline?: string | null
  bio?: string | null
  skills?: string[] | null
}

class UsersApi {
  async getMe(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/api/users/me')
  }

  async updateMe(data: UserProfileUpdate): Promise<{ message: string; data: UserProfile }> {
    return apiClient.put<{ message: string; data: UserProfile }>('/api/users/me', data)
  }
}

export const usersApi = new UsersApi()
