import { apiClient } from './api-client'

export const MAX_RESUME_BYTES = 10 * 1024 * 1024

export function validateResumeFile(file: Pick<File, 'name' | 'size'>): string | null {
  if (!/\.(pdf|doc|docx)$/i.test(file.name)) return 'Only PDF, DOC, DOCX files are supported.'
  if (file.size === 0) return 'Resume file is empty.'
  if (file.size > MAX_RESUME_BYTES) return 'Resume must be 10 MB or smaller.'
  return null
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExperienceItem {
  company: string | null
  role: string | null
  duration: string | null
  description: string | null
  technologies: string[]
}

export interface EducationItem {
  institution: string | null
  degree: string | null
  field: string | null
  year: string | null
  grade: string | null
}

export interface ProjectItem {
  title: string | null
  description: string | null
  technologies: string[]
  github: string | null
  live_link: string | null
}

export interface CertificationItem {
  name: string | null
  issuer: string | null
  year: string | null
}

export interface ResumeContent {
  contact?: Partial<Record<'name' | 'first_name' | 'last_name' | 'email' | 'phone_number' | 'location' | 'linkedin' | 'github' | 'portfolio', string | null>>
  id: string
  resume_id: string
  summary: string | null
  skills: string[]
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
  certifications: CertificationItem[]
  achievements: string[]
  languages: string[]
}

export interface Resume {
  id: string
  user_id: string
  filename: string
  file_url: string | null
  filetype: string
  is_generated: boolean
  active: boolean
  created_at: string
  resume_content: ResumeContent[]
}

export type ResumeContentUpdate = Partial<Omit<ResumeContent, 'id' | 'resume_id'>>

// ── API class ──────────────────────────────────────────────────────────────

class ResumesApi {
  /** Fetch all resumes for the authenticated user */
  async getUserResumes(): Promise<Resume[]> {
    return apiClient.get<Resume[]>('/api/resumes/')
  }

  /** Fetch a single resume with its content */
  async getResume(resumeId: string): Promise<Resume> {
    return apiClient.get<Resume>(`/api/resumes/${resumeId}`)
  }

  /** Update the content of a resume */
  async updateResume(resumeId: string, content: ResumeContentUpdate): Promise<{ message: string; data: ResumeContent }> {
    return apiClient.put<{ message: string; data: ResumeContent }>(`/api/resumes/${resumeId}`, content)
  }

  /** Upload a new resume file */
  async uploadResume(file: File): Promise<{ message: string; data: { resume: Resume; content: ResumeContent } }> {
    const error = validateResumeFile(file)
    if (error) throw new Error(error)
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.request('/api/resumes/', { method: 'POST', body: formData })
  }

  async getDownloadUrl(resumeId: string): Promise<{ url: string; expires_in: number }> {
    return apiClient.get(`/api/resumes/${resumeId}/download`)
  }

  /** Delete a resume */
  async deleteResume(resumeId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/resumes/${resumeId}`)
  }
}

export const resumesApi = new ResumesApi()
