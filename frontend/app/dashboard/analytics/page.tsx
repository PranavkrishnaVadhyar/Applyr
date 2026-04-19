'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Target, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

// ── Types ───────────────────────────────────────────────────────────────────

interface MonthlyEntry {
  month: string
  count: number
}

interface TopCompany {
  company: string
  applications: number
}

interface AnalyticsData {
  total_applications: number
  success_rate: number
  interviews: number
  avg_response_time: number
  applications_over_time: MonthlyEntry[]
  status_breakdown: Record<string, number>
  top_companies: TopCompany[]
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const result = await apiClient.get<AnalyticsData>('/api/analytics/me')
        setData(result)
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to load analytics'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <div className="h-8 w-48 bg-secondary/50 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-secondary/40 rounded mt-2 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-secondary/40 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="h-64 bg-secondary/40 rounded-xl animate-pulse" />
            <div className="h-64 bg-secondary/40 rounded-xl animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error ?? 'No data available'}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const metrics = [
    {
      label: 'Total Applications',
      value: String(data.total_applications),
      change: `${data.total_applications} total recorded`,
      icon: BarChart3,
    },
    {
      label: 'Success Rate',
      value: `${data.success_rate}%`,
      change: 'interviews + offers / total',
      icon: TrendingUp,
    },
    {
      label: 'Interviews',
      value: String(data.interviews),
      change: 'reached interview stage',
      icon: Target,
    },
    {
      label: 'Avg. Response Time',
      value: `${data.avg_response_time} days`,
      change: 'applied → last update',
      icon: Calendar,
    },
  ]

  const statusBreakdown = Object.entries(data.status_breakdown).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage:
      data.total_applications > 0
        ? Math.round((count / data.total_applications) * 100)
        : 0,
  }))

  const maxMonthlyCount = Math.max(
    1,
    ...data.applications_over_time.map((d) => d.count),
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Insights on your job search performance</p>
          </div>
          <Button variant="outline">
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <Card
                key={i}
                className="bg-card border border-border rounded-xl shadow-soft p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{metric.value}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/8 group-hover:bg-primary/12 transition-colors duration-200">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{metric.change}</p>
              </Card>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Applications Over Time */}
          <Card className="bg-card border border-border rounded-xl shadow-soft p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Applications Over Time</h2>
            {data.applications_over_time.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No timeline data yet.</p>
            ) : (
              <div className="space-y-4">
                {data.applications_over_time.map((entry, i) => {
                  const barWidth = (entry.count / maxMonthlyCount) * 100
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{entry.month}</span>
                        <span className="text-sm font-semibold text-foreground">{entry.count}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Status Breakdown */}
          <Card className="bg-card border border-border rounded-xl shadow-soft p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Status Breakdown</h2>
            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No status data yet.</p>
            ) : (
              <div className="space-y-4">
                {statusBreakdown.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{item.status}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Top Companies */}
        <Card className="bg-card border border-border rounded-xl shadow-soft p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Top Application Companies</h2>
          {data.top_companies.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No company data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.top_companies.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors duration-150"
                >
                  <p className="font-medium text-foreground text-sm">{item.company}</p>
                  <span className="text-sm font-semibold text-primary">
                    {item.applications} app{item.applications !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Insights */}
        <Card className="bg-card border border-border rounded-xl shadow-soft p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Insights & Recommendations</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary">→</span>
              <span>
                You have submitted{' '}
                <strong className="text-foreground">{data.total_applications}</strong> application
                {data.total_applications !== 1 ? 's' : ''} in total.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">→</span>
              <span>
                Your interview conversion rate is{' '}
                <strong className="text-foreground">{data.success_rate}%</strong>
                {data.success_rate >= 15
                  ? ' — above the industry average of 15%. Great work!'
                  : ' — keep refining your resume and cover letters to improve.'}
              </span>
            </li>
            {data.avg_response_time > 0 && (
              <li className="flex gap-3">
                <span className="text-primary">→</span>
                <span>
                  Companies take an average of{' '}
                  <strong className="text-foreground">{data.avg_response_time} days</strong> to
                  respond to your applications.
                </span>
              </li>
            )}
            {data.top_companies[0] && (
              <li className="flex gap-3">
                <span className="text-primary">→</span>
                <span>
                  Your most targeted company is{' '}
                  <strong className="text-foreground">{data.top_companies[0].company}</strong> with{' '}
                  {data.top_companies[0].applications} application
                  {data.top_companies[0].applications !== 1 ? 's' : ''}.
                </span>
              </li>
            )}
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}
