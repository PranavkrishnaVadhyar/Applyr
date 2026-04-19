'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Copy, Check } from 'lucide-react'

export default function ExtractJobPage() {
  const [jobUrl, setJobUrl] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [extracted, setExtracted] = useState<Record<string, unknown> | null>(null)
  const [copied, setCopied] = useState(false)

  const handleExtract = async () => {
    setIsLoading(true)
    // Simulate extraction
    setTimeout(() => {
      setExtracted({
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        salary: '$150,000 - $180,000 per year',
        jobType: 'Full-time',
        requirements: ['5+ years experience', 'React/Node.js', 'PostgreSQL'],
        description:
          'We are looking for a talented Senior Software Engineer to join our growing team...',
      })
      setIsLoading(false)
    }, 2000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(extracted, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Extract Job</h1>
          <p className="text-muted-foreground mt-2">
            Extract job details from a URL or paste job description
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="card-dark glass-effect p-6">
            <h2 className="font-display text-xl font-bold mb-6">Job Source</h2>

            <div className="space-y-6">
              {/* URL Input */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Job Posting URL</Label>
                <Input
                  placeholder="https://linkedin.com/jobs/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="input-dark"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Paste the URL of the job posting
                </p>
              </div>

              {/* Or Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Description Input */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Job Description</Label>
                <textarea
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="input-dark w-full h-48 p-4 rounded-lg resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Copy and paste the full job posting text
                </p>
              </div>

              {/* Extract Button */}
              <Button
                className="w-full button-neon"
                disabled={isLoading || (!jobUrl && !jobDescription)}
                onClick={handleExtract}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Extracting...
                  </>
                ) : (
                  'Extract Job Details'
                )}
              </Button>
            </div>
          </Card>

          {/* Results Section */}
          <Card className="card-dark glass-effect p-6">
            <h2 className="font-display text-xl font-bold mb-6">Extracted Details</h2>

            {!extracted ? (
              <div className="flex items-center justify-center h-96 text-center text-muted-foreground">
                <div>
                  <p className="mb-2">No results yet</p>
                  <p className="text-sm">Extract a job posting to see details here</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(extracted).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm text-foreground break-words">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </p>
                  </div>
                ))}

                {/* Actions */}
                <div className="pt-4 border-t border-border space-y-2 flex gap-2">
                  <Button className="flex-1 button-neon" size="sm">
                    Create Application
                  </Button>
                  <Button
                    variant="outline"
                    className="button-outline-neon"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check size={16} className="mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
