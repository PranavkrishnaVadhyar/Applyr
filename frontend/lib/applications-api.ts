import { apiClient } from './api-client'

export interface Application {
  id: string
  user_id: string
  resume_id?: string | null
  job_role: string
  job_description: string
  company_name: string
  company_description?: string | null
  final_date?: string | null
  response?: Record<string, any> | null
  status: string
  applied_at: string
  created_at: string
  updated_at: string
}

class ApplicationsApi {
  /**
   * Fetch all applications for a specific user ID.
   */
  async getUserApplications(userId: string): Promise<Application[]> {
    return apiClient.get<Application[]>(`/api/applications/user/${userId}`)
  }

  /**
   * Fetch a single application by its ID.
   */
  async getApplication(applicationId: string): Promise<Application> {
    return apiClient.get<Application>(`/api/applications/${applicationId}`)
  }

  /**
   * Delete an application by its ID.
   */
  async deleteApplication(applicationId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/applications/${applicationId}`)
  }
}

export const applicationsApi = new ApplicationsApi()
