'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, MoreVertical, Eye, Trash2, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { applicationsApi, Application } from '@/lib/applications-api'

const statusColors: Record<string, string> = {
  applied: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  interviewing: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  offer: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  draft: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
}

export default function ApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  useEffect(() => {
    async function fetchApplications() {
      if (!user) return
      
      try {
        const apps = await applicationsApi.getUserApplications(user.id)
        setApplications(apps)
      } catch (err) {
        console.error("Failed to load applications:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchApplications()
    } else {
      setIsLoading(false)
    }
  }, [user])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground mt-1">Track all your job applications</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter size={18} />
            Filter
          </Button>
        </div>

        {/* Applications Table */}
        <Card className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <div className="space-y-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-12 bg-secondary/40 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No applications found. Use the chrome extension to add some!
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{app.job_role}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-foreground text-sm">{app.company_name}</p>
                        {app.company_description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[200px]">{app.company_description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[250px]">{app.job_description || '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {app.final_date ? new Date(app.final_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status?.toLowerCase()] || 'bg-secondary text-muted-foreground'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors duration-150"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-150"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedApp(null)} />
          <div className="relative bg-card border border-border rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">{selectedApp.job_role}</h2>
                <p className="text-muted-foreground">{selectedApp.company_name}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedApp.status?.toLowerCase()] || 'bg-secondary text-muted-foreground'}`}>
                  {selectedApp.status}
                </span>
                {selectedApp.applied_at && (
                  <span className="text-xs text-muted-foreground">
                    Applied {new Date(selectedApp.applied_at).toLocaleDateString()}
                  </span>
                )}
                {selectedApp.final_date && (
                  <span className="text-xs text-muted-foreground">
                    • Deadline {new Date(selectedApp.final_date).toLocaleDateString()}
                  </span>
                )}
              </div>

              {selectedApp.job_description && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Job Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedApp.job_description}</p>
                </div>
              )}

              {selectedApp.company_description && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">About {selectedApp.company_name}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedApp.company_description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground">{new Date(selectedApp.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm text-foreground">{new Date(selectedApp.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
