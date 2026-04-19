'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart3, TrendingUp, CheckCircle, Clock } from 'lucide-react'

const stats = [
  {
    label: 'Applications',
    value: '24',
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
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 page-enter">
        {/* Header */}
        <div className="animate-slide-in-up">
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">Welcome Back!</h1>
          <p className="text-muted-foreground mt-2">Here's your job search overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card
                key={i}
                className="card-dark p-6 glass-effect hover-lift hover-glow cursor-pointer group overflow-hidden relative transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                    <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground relative z-10">{stat.change}</p>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="card-dark glass-effect p-6 rounded-xl animate-slide-in-up hover-glow transition-all duration-300">
          <h2 className="font-display text-xl font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href="/dashboard/extract-job">
              <Button className="w-full button-neon">Extract Job</Button>
            </Link>
            <Link href="/dashboard/applications">
              <Button variant="outline" className="w-full button-outline-neon">
                View Applications
              </Button>
            </Link>
            <Link href="/dashboard/resumes">
              <Button variant="outline" className="w-full button-outline-neon">
                Manage Resumes
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card-dark glass-effect p-6 rounded-xl">
          <h2 className="font-display text-xl font-bold mb-4">Recent Applications</h2>
          <div className="space-y-3">
            {[
              { company: 'Tech Corp', position: 'Senior Engineer', status: 'Applied' },
              { company: 'StartUp Inc', position: 'Full Stack Developer', status: 'Interviewing' },
              { company: 'Cloud Systems', position: 'Backend Engineer', status: 'Applied' },
            ].map((app, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border/50">
                <div>
                  <p className="font-medium text-foreground">{app.position}</p>
                  <p className="text-sm text-muted-foreground">{app.company}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  app.status === 'Interviewing'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
