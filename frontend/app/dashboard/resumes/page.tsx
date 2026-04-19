'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Trash2, Download, Check, Star } from 'lucide-react'

const resumes = [
  {
    id: 1,
    name: 'Resume_2024_Main.pdf',
    uploadedAt: '2024-03-08',
    size: '245 KB',
    isDefault: true,
  },
  {
    id: 2,
    name: 'Resume_Tech_Focus.pdf',
    uploadedAt: '2024-03-01',
    size: '198 KB',
    isDefault: false,
  },
  {
    id: 3,
    name: 'Resume_Startup.pdf',
    uploadedAt: '2024-02-25',
    size: '220 KB',
    isDefault: false,
  },
]

export default function ResumesPage() {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Resumes</h1>
          <p className="text-muted-foreground mt-1">Manage your resume files and versions</p>
        </div>

        {/* Upload Section */}
        <Card
          className={`bg-card border-2 border-dashed rounded-xl transition-colors duration-150 cursor-pointer p-8 text-center ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-lg bg-primary/8">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Drag and drop your resume</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOCX (Max 5 MB)
            </p>
            <Button className="bg-primary text-primary-foreground font-medium hover:brightness-95 mt-2">Upload Resume</Button>
          </div>
        </Card>

        {/* Resumes List */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Your Resumes</h2>

          {resumes.map((resume) => (
            <Card key={resume.id} className="bg-card border border-border rounded-xl shadow-soft p-4 flex items-center justify-between hover:shadow-card transition-shadow duration-200">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 rounded-lg bg-secondary">
                  <svg className="w-6 h-6 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 012-2h7.414a2 2 0 011.414.586l2.586 2.586A2 2 0 0118 6.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    {resume.name}
                    {resume.isDefault && (
                      <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                        <Star size={12} className="fill-primary" />
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {resume.size} • {new Date(resume.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!resume.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                  >
                    <Check size={14} />
                    Set Default
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Download size={16} />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Tips */}
        <Card className="bg-card border border-border rounded-xl shadow-soft p-6">
          <h3 className="font-display font-semibold text-foreground mb-3">Pro Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Upload multiple resume versions for different job types</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Keep your main resume updated regularly</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Use your default resume for quick applications</span>
            </li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}
