'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Target, Calendar } from 'lucide-react'

const metrics = [
  {
    label: 'Total Applications',
    value: '42',
    change: '+8 this month',
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
    value: '8',
    change: '5 scheduled',
    icon: Target,
  },
  {
    label: 'Avg. Response Time',
    value: '3.2 days',
    change: '↓0.5 days vs avg',
    icon: Calendar,
  },
]

const statusBreakdown = [
  { status: 'Applied', count: 28, percentage: 67 },
  { status: 'Interviewing', count: 8, percentage: 19 },
  { status: 'Rejected', count: 4, percentage: 10 },
  { status: 'Offer', count: 2, percentage: 4 },
]

const monthlyData = [
  { month: 'Jan', applications: 12 },
  { month: 'Feb', applications: 18 },
  { month: 'Mar', applications: 42 },
]

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-2">Insights on your job search performance</p>
          </div>
          <Button variant="outline" className="button-outline-neon">
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <Card key={i} className="card-dark glass-effect p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{metric.value}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{metric.change}</p>
              </Card>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Application Trends */}
          <Card className="card-dark glass-effect p-6">
            <h2 className="font-display text-lg font-bold mb-4">Applications Over Time</h2>
            <div className="space-y-4">
              {monthlyData.map((data, i) => {
                const barWidth = (data.applications / 42) * 100
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{data.month}</span>
                      <span className="text-sm font-semibold text-foreground">{data.applications}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Status Breakdown */}
          <Card className="card-dark glass-effect p-6">
            <h2 className="font-display text-lg font-bold mb-4">Status Breakdown</h2>
            <div className="space-y-4">
              {statusBreakdown.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{item.status}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary/50 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top Companies */}
        <Card className="card-dark glass-effect p-6">
          <h2 className="font-display text-lg font-bold mb-4">Top Application Companies</h2>
          <div className="space-y-3">
            {[
              { company: 'Tech Corp', applications: 4 },
              { company: 'StartUp Inc', applications: 3 },
              { company: 'Cloud Systems', applications: 3 },
              { company: 'Design Studio', applications: 2 },
              { company: 'Infrastructure Pro', applications: 2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="font-medium text-foreground">{item.company}</p>
                <span className="text-sm font-semibold text-primary">{item.applications} apps</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Insights */}
        <Card className="card-dark glass-effect p-6 bg-primary/5 border-primary/20">
          <h3 className="font-display font-bold text-foreground mb-4">Insights & Recommendations</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary">→</span>
              <span>Your application rate has increased 167% compared to last month</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">→</span>
              <span>Interview rate is at 19%, which is above industry average of 15%</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">→</span>
              <span>Consider optimizing your resume for tech companies - 40% of your applications are tech roles</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">→</span>
              <span>You respond to interviews 1.2 days faster than the average, great job!</span>
            </li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}
