import { apiClient } from './api-client'

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
  async updateResume(resumeId: string, content: Partial<ResumeContent>): Promise<{ message: string; data: ResumeContent }> {
    return apiClient.put<{ message: string; data: ResumeContent }>(`/api/resumes/${resumeId}`, content)
  }

  /** Upload a new resume file */
  async uploadResume(file: File): Promise<{ message: string; data: { resume: Resume; content: ResumeContent } }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/resumes/`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw { message: err.detail || `HTTP ${response.status}`, status: response.status }
    }

    return response.json()
  }

  /** Delete a resume */
  async deleteResume(resumeId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/resumes/${resumeId}`)
  }
}

export const resumesApi = new ResumesApi()
