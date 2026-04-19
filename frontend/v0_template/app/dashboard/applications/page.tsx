'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, MoreVertical } from 'lucide-react'

const applications = [
  {
    id: 1,
    position: 'Senior Software Engineer',
    company: 'Tech Corp',
    dateApplied: '2024-03-08',
    status: 'Applied',
    salary: '$150k - $180k',
  },
  {
    id: 2,
    position: 'Full Stack Developer',
    company: 'StartUp Inc',
    dateApplied: '2024-03-06',
    status: 'Interviewing',
    salary: '$100k - $130k',
  },
  {
    id: 3,
    position: 'Backend Engineer',
    company: 'Cloud Systems',
    dateApplied: '2024-03-05',
    status: 'Applied',
    salary: '$120k - $150k',
  },
  {
    id: 4,
    position: 'DevOps Engineer',
    company: 'Infrastructure Pro',
    dateApplied: '2024-03-03',
    status: 'Rejected',
    salary: '$130k - $160k',
  },
  {
    id: 5,
    position: 'Frontend Engineer',
    company: 'Design Studio',
    dateApplied: '2024-03-01',
    status: 'Offer',
    salary: '$110k - $140k',
  },
]

const statusColors: Record<string, string> = {
  Applied: 'bg-blue-500/20 text-blue-400',
  Interviewing: 'bg-primary/20 text-primary',
  Rejected: 'bg-destructive/20 text-destructive',
  Offer: 'bg-emerald-500/20 text-emerald-400',
}

export default function ApplicationsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground mt-2">Track all your job applications</p>
          </div>
          <Button className="button-neon gap-2">
            <Plus size={18} />
            New Application
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="input-dark pl-10"
            />
          </div>
          <Button variant="outline" className="button-outline-neon gap-2">
            <Filter size={18} />
            Filter
          </Button>
        </div>

        {/* Applications Table */}
        <Card className="card-dark glass-effect overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Date Applied</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Salary</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{app.position}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{app.company}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {new Date(app.dateApplied).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{app.salary}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status]}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
