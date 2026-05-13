'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Upload, Trash2, FileText, X, ChevronRight,
  Save, Plus, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import {
  resumesApi, Resume, ResumeContent,
  ExperienceItem, EducationItem, ProjectItem, CertificationItem
} from '@/lib/resumes-api'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function FileIcon({ type }: { type: string }) {
  return (
    <div className="p-3 rounded-xl bg-primary/10 flex items-center justify-center">
      <FileText className="w-5 h-5 text-primary" />
    </div>
  )
}

// ── Tag input (skills, achievements, etc.) ───────────────────────────────────

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('')
  const add = () => {
    const val = input.trim()
    if (val && !values.includes(val)) onChange([...values, val])
    setInput('')
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder || 'Type and press Enter'}
          className="text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}><Plus size={14} /></Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-destructive">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Resume Editor ─────────────────────────────────────────────────────────────

function ResumeEditor({ resume, onClose, onSaved }: { resume: Resume; onClose: () => void; onSaved: (updated: Resume) => void }) {
  const content: ResumeContent = resume.resume_content?.[0] ?? {
    id: '', resume_id: resume.id, summary: '', skills: [], experience: [], education: [],
    projects: [], certifications: [], achievements: [], languages: []
  }

  const [form, setForm] = useState<Partial<ResumeContent>>({
    summary: content.summary ?? '',
    skills: content.skills ?? [],
    experience: content.experience ?? [],
    education: content.education ?? [],
    projects: content.projects ?? [],
    certifications: content.certifications ?? [],
    achievements: content.achievements ?? [],
    languages: content.languages ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const set = (key: keyof ResumeContent, val: unknown) => setForm(f => ({ ...f, [key]: val }))

  const save = async () => {
    setSaving(true)
    try {
      await resumesApi.updateResume(resume.id, form)
      setToast({ type: 'success', msg: 'Resume updated successfully!' })
      setTimeout(() => setToast(null), 3000)
      onSaved({ ...resume, resume_content: [{ ...content, ...form } as ResumeContent] })
    } catch {
      setToast({ type: 'error', msg: 'Failed to save. Please try again.' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  // ── Experience helpers
  const updateExp = (i: number, key: keyof ExperienceItem, val: unknown) =>
    set('experience', (form.experience ?? []).map((e, j) => j === i ? { ...e, [key]: val } : e))
  const addExp = () => set('experience', [...(form.experience ?? []), { company: '', role: '', duration: '', description: '', technologies: [] }])
  const removeExp = (i: number) => set('experience', (form.experience ?? []).filter((_, j) => j !== i))

  // ── Education helpers
  const updateEdu = (i: number, key: keyof EducationItem, val: string) =>
    set('education', (form.education ?? []).map((e, j) => j === i ? { ...e, [key]: val } : e))
  const addEdu = () => set('education', [...(form.education ?? []), { institution: '', degree: '', field: '', year: '', grade: '' }])
  const removeEdu = (i: number) => set('education', (form.education ?? []).filter((_, j) => j !== i))

  // ── Project helpers
  const updateProj = (i: number, key: keyof ProjectItem, val: unknown) =>
    set('projects', (form.projects ?? []).map((p, j) => j === i ? { ...p, [key]: val } : p))
  const addProj = () => set('projects', [...(form.projects ?? []), { title: '', description: '', technologies: [], github: '', live_link: '' }])
  const removeProj = (i: number) => set('projects', (form.projects ?? []).filter((_, j) => j !== i))

  // ── Certification helpers
  const updateCert = (i: number, key: keyof CertificationItem, val: string) =>
    set('certifications', (form.certifications ?? []).map((c, j) => j === i ? { ...c, [key]: val } : c))
  const addCert = () => set('certifications', [...(form.certifications ?? []), { name: '', issuer: '', year: '' }])
  const removeCert = (i: number) => set('certifications', (form.certifications ?? []).filter((_, j) => j !== i))

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">{resume.filename}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Uploaded {formatDate(resume.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={save} disabled={saving} size="sm" className="gap-2 bg-primary text-primary-foreground hover:brightness-95">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in ${
            toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Summary */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Summary</h3>
            <textarea
              value={form.summary ?? ''}
              onChange={e => set('summary', e.target.value)}
              rows={4}
              placeholder="Professional summary…"
              className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </section>

          {/* Skills */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Skills</h3>
            <TagInput values={form.skills ?? []} onChange={v => set('skills', v)} placeholder="Add skill…" />
          </section>

          {/* Experience */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Experience</h3>
              <Button variant="outline" size="sm" onClick={addExp} className="gap-1 text-xs"><Plus size={12} />Add</Button>
            </div>
            <div className="space-y-4">
              {(form.experience ?? []).map((exp, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">Entry {i + 1}</span>
                    <button onClick={() => removeExp(i)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={exp.company ?? ''} onChange={e => updateExp(i, 'company', e.target.value)} placeholder="Company" className="text-sm" />
                    <Input value={exp.role ?? ''} onChange={e => updateExp(i, 'role', e.target.value)} placeholder="Role" className="text-sm" />
                    <Input value={exp.duration ?? ''} onChange={e => updateExp(i, 'duration', e.target.value)} placeholder="Duration (e.g. Jan 2023 – Mar 2024)" className="text-sm col-span-2" />
                  </div>
                  <textarea
                    value={exp.description ?? ''}
                    onChange={e => updateExp(i, 'description', e.target.value)}
                    rows={3}
                    placeholder="Description…"
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Technologies</p>
                    <TagInput values={exp.technologies ?? []} onChange={v => updateExp(i, 'technologies', v)} placeholder="Add tech…" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Education</h3>
              <Button variant="outline" size="sm" onClick={addEdu} className="gap-1 text-xs"><Plus size={12} />Add</Button>
            </div>
            <div className="space-y-4">
              {(form.education ?? []).map((edu, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">Entry {i + 1}</span>
                    <button onClick={() => removeEdu(i)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={edu.institution ?? ''} onChange={e => updateEdu(i, 'institution', e.target.value)} placeholder="Institution" className="text-sm col-span-2" />
                    <Input value={edu.degree ?? ''} onChange={e => updateEdu(i, 'degree', e.target.value)} placeholder="Degree" className="text-sm" />
                    <Input value={edu.field ?? ''} onChange={e => updateEdu(i, 'field', e.target.value)} placeholder="Field of study" className="text-sm" />
                    <Input value={edu.year ?? ''} onChange={e => updateEdu(i, 'year', e.target.value)} placeholder="Year" className="text-sm" />
                    <Input value={edu.grade ?? ''} onChange={e => updateEdu(i, 'grade', e.target.value)} placeholder="Grade / CGPA" className="text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Projects</h3>
              <Button variant="outline" size="sm" onClick={addProj} className="gap-1 text-xs"><Plus size={12} />Add</Button>
            </div>
            <div className="space-y-4">
              {(form.projects ?? []).map((proj, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground">Project {i + 1}</span>
                    <button onClick={() => removeProj(i)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={14} /></button>
                  </div>
                  <Input value={proj.title ?? ''} onChange={e => updateProj(i, 'title', e.target.value)} placeholder="Project title" className="text-sm" />
                  <textarea
                    value={proj.description ?? ''}
                    onChange={e => updateProj(i, 'description', e.target.value)}
                    rows={3}
                    placeholder="Description…"
                    className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={proj.github ?? ''} onChange={e => updateProj(i, 'github', e.target.value)} placeholder="GitHub URL" className="text-sm" />
                    <Input value={proj.live_link ?? ''} onChange={e => updateProj(i, 'live_link', e.target.value)} placeholder="Live URL" className="text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Technologies</p>
                    <TagInput values={proj.technologies ?? []} onChange={v => updateProj(i, 'technologies', v)} placeholder="Add tech…" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Certifications</h3>
              <Button variant="outline" size="sm" onClick={addCert} className="gap-1 text-xs"><Plus size={12} />Add</Button>
            </div>
            <div className="space-y-3">
              {(form.certifications ?? []).map((cert, i) => (
                <div key={i} className="border border-border rounded-xl p-4 bg-secondary/20">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-muted-foreground">Cert {i + 1}</span>
                    <button onClick={() => removeCert(i)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input value={cert.name ?? ''} onChange={e => updateCert(i, 'name', e.target.value)} placeholder="Certification name" className="text-sm col-span-2" />
                    <Input value={cert.year ?? ''} onChange={e => updateCert(i, 'year', e.target.value)} placeholder="Year" className="text-sm" />
                    <Input value={cert.issuer ?? ''} onChange={e => updateCert(i, 'issuer', e.target.value)} placeholder="Issuing organisation" className="text-sm col-span-3" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Achievements */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Achievements</h3>
            <TagInput values={form.achievements ?? []} onChange={v => set('achievements', v)} placeholder="Add achievement…" />
          </section>

          {/* Languages */}
          <section className="pb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Languages</h3>
            <TagInput values={form.languages ?? []} onChange={v => set('languages', v)} placeholder="Add language…" />
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ResumesPage() {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState<Resume | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchResumes = useCallback(async () => {
    try {
      const data = await resumesApi.getUserResumes()
      setResumes(data)
    } catch {
      console.error('Failed to load resumes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { if (user) fetchResumes() }, [user, fetchResumes])

  const handleFile = async (file: File) => {
    const allowed = ['pdf', 'doc', 'docx']
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!allowed.includes(ext)) { setUploadError('Only PDF, DOC, DOCX files are supported.'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('File must be under 5 MB.'); return }

    setUploading(true)
    setUploadError(null)
    try {
      await resumesApi.uploadResume(file)
      await fetchResumes()
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleDelete = async (id: string) => {
    setDeleteId(id)
    try {
      await resumesApi.deleteResume(id)
      setResumes(r => r.filter(x => x.id !== id))
      if (selected?.id === id) setSelected(null)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Resumes</h1>
          <p className="text-muted-foreground mt-1">Upload your resumes and manage extracted content</p>
        </div>

        {/* Upload Zone */}
        <Card
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-card hover:border-primary/50'
          }`}
          onDragEnter={e => { e.preventDefault(); setDragActive(true) }}
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
          onDrop={handleDrop}
          onClick={() => document.getElementById('resume-file-input')?.click()}
        >
          <input
            id="resume-file-input"
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
          <div className="flex flex-col items-center gap-3">
            <div className={`p-4 rounded-xl transition-colors duration-200 ${dragActive ? 'bg-primary/20' : 'bg-primary/10'}`}>
              {uploading ? <Loader2 className="w-7 h-7 text-primary animate-spin" /> : <Upload className="w-7 h-7 text-primary" />}
            </div>
            <div>
              <p className="font-semibold text-foreground">{uploading ? 'Uploading & extracting…' : 'Drag & drop your resume here'}</p>
              <p className="text-sm text-muted-foreground mt-1">{uploading ? 'This may take a few seconds' : 'or click to browse — PDF, DOC, DOCX · Max 5 MB'}</p>
            </div>
          </div>
        </Card>

        {uploadError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle size={16} /> {uploadError}
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Your Resumes
            {!isLoading && <span className="ml-2 text-sm font-normal text-muted-foreground">({resumes.length})</span>}
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-secondary/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <Card className="bg-card border border-border rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No resumes uploaded yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Upload one above to get started.</p>
            </Card>
          ) : (
            resumes.map(resume => (
              <Card
                key={resume.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => setSelected(resume)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <FileIcon type={resume.filetype} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{resume.filename}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {resume.filetype.toUpperCase()} · Uploaded {formatDate(resume.created_at)}
                      {resume.resume_content?.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={10} /> Content extracted
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(resume) }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    View & Edit <ChevronRight size={12} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(resume.id) }}
                    disabled={deleteId === resume.id}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Delete resume"
                  >
                    {deleteId === resume.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Side-panel editor */}
      {selected && (
        <ResumeEditor
          resume={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => {
            setResumes(r => r.map(x => x.id === updated.id ? updated : x))
            setSelected(updated)
          }}
        />
      )}
    </DashboardLayout>
  )
}
