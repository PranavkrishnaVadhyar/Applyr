'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart3, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { applicationsApi, Application } from '@/lib/applications-api'

const stats = [
  {
    label: 'Applications',
    value: '0',
    change: '+4 this month',
    icon: BarChart3,
  },
  {
    label: 'Success Rate',
    value: '18%',
    change: '+2% from last month',
    icon: TrendingUp,
  },
  {
    label: 'Interviews',
    value: '4',
    change: '2 pending',
    icon: CheckCircle,
  },
  {
    label: 'Avg. Time to Hire',
    value: '21 days',
    change: '↓3 days vs avg',
    icon: Clock,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Dynamically update the application count stat
  const dynamicStats = [...stats]
  dynamicStats[0].value = applications.length.toString()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">Welcome Back{user ? `, ${user.name || user.email.split('@')[0]}` : ''}!</h1>
          <p className="text-muted-foreground mt-1">Here's your job search overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicStats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card
                key={i}
                className="bg-card border border-border rounded-xl p-6 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/8 group-hover:bg-primary/12 transition-colors duration-200">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/dashboard/applications">
              <Button variant="outline" className="w-full">
                View Applications
              </Button>
            </Link>
            <Link href="/dashboard/resumes">
              <Button variant="outline" className="w-full">
                Manage Resumes
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Applications</h2>
            <Link href="/dashboard/applications" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          
          <div className="space-y-2">
            {isLoading ? (
               <div className="space-y-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-20 bg-secondary/50 rounded-lg animate-pulse" />
                 ))}
               </div>
            ) : applications.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-lg">
                 <p className="text-sm">No applications recorded yet.</p>
               </div>
            ) : (
              applications.slice(0, 5).map((app) => (
                <div key={app.id} className="p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors duration-150">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium text-foreground truncate">{app.job_role}</p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                          app.status.toLowerCase() === 'interviewing'
                            ? 'bg-primary/10 text-primary'
                            : app.status.toLowerCase() === 'offer'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : app.status.toLowerCase() === 'rejected'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{app.company_name}</p>
                      {app.job_description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{app.job_description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 text-xs text-muted-foreground">
                      {app.applied_at && (
                        <p>Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                      )}
                      {app.final_date && (
                        <p className="mt-0.5">Deadline {new Date(app.final_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
