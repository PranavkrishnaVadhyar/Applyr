 'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, CheckCircle2, Compass } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { applicationsApi, Application } from '@/lib/applications-api'
import { resumesApi, Resume } from '@/lib/resumes-api'

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<{ applications: Application[]; resumes: Resume[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!user) return
    let active = true; setError(null); setData(null)
    Promise.all([applicationsApi.getUserApplications(user.id), resumesApi.getUserResumes()])
      .then(([applications, resumes]) => { if (active) setData({ applications, resumes }) })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'Could not load your workspace.') })
    return () => { active = false }
  }, [user, retry])
  const drafts = data?.applications.filter(app => app.status === 'draft') || []
  return <DashboardLayout><div className="space-y-8">
    <div><p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold mb-3">Your workspace</p><h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Keep your next step in sight.</h1><p className="mt-3 text-muted-foreground">Welcome{user?.first_name ? `, ${user.first_name}` : ''}. Pick up where you left off.</p></div>
    {error ? <div role="alert" className="border rounded-xl bg-card p-6 space-y-3"><p>{error}</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}>Try again</Button></div> : !data ? <div role="status" className="rounded-xl bg-card border p-8 text-muted-foreground">Loading your workspace…</div> : <>
      <section className="rounded-2xl border bg-card p-6 md:p-8 grid md:grid-cols-[1fr_auto] items-center gap-6">
        <div><div className="flex items-center gap-2 text-primary text-sm font-medium mb-3"><Compass size={18} /> Your next step</div><h2 className="font-display text-2xl font-semibold">{!data.resumes.length ? 'Start with your experience.' : drafts.length ? `Continue ${drafts.length === 1 ? 'your application' : 'an application'}.` : 'Your resume is ready to review.'}</h2><p className="text-muted-foreground mt-2 max-w-xl">{!data.resumes.length ? 'Upload a resume, then review the facts Applyr will use to suggest answers.' : drafts.length ? `${drafts[0].job_role} at ${drafts[0].company_name}. Open it in the extension to continue reviewing answers.` : 'Check your saved facts, then open a job application with the Chrome extension.'}</p></div>
        <Button size="lg" asChild><Link href={!data.resumes.length ? '/dashboard/resumes' : drafts.length ? '/dashboard/applications' : '/dashboard/setup'}>{!data.resumes.length ? 'Upload a resume' : drafts.length ? 'View drafts' : 'Set up the extension'}<ArrowRight size={16} /></Link></Button>
      </section>
      <div className="grid sm:grid-cols-3 gap-4">{[
        ['Drafts', drafts.length, 'Saved, not submitted'],
        ['Applied', data.applications.filter(app => app.status !== 'draft').length, 'Marked or detected as submitted'],
        ['Interviewing', data.applications.filter(app => app.status === 'interviewing').length, 'Current stage in your tracker'],
      ].map(([label, value, note]) => <div key={label} className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-display font-semibold mt-2">{value}</p><p className="text-xs text-muted-foreground mt-2">{note}</p></div>)}</div>
      <section><div className="flex justify-between items-center mb-4"><h2 className="font-display text-xl font-semibold">Recent applications</h2><Link href="/dashboard/applications" className="text-sm text-primary hover:underline">View all →</Link></div>
        {!data.applications.length ? <div className="rounded-xl border border-dashed p-8 text-center"><FileText className="mx-auto text-primary mb-3" size={24} /><h3 className="font-medium">Your first application starts here.</h3><p className="text-sm text-muted-foreground mt-2 mb-4">Use the extension to save a job and review your answers.</p><Button variant="outline" asChild><Link href="/dashboard/setup">Connect the extension</Link></Button></div> : <div className="rounded-xl border bg-card divide-y">{data.applications.slice(0, 5).map(app => <Link href="/dashboard/applications" key={app.id} className="flex items-center justify-between gap-4 p-5 hover:bg-secondary/50"><div><p className="font-medium">{app.job_role}</p><p className="text-sm text-muted-foreground">{app.company_name}</p></div><span className="text-xs font-medium capitalize rounded-full bg-secondary px-3 py-1">{app.status}</span></Link>)}</div>}
      </section>
      <section className="rounded-xl border p-5 flex items-start gap-3"><CheckCircle2 size={20} className="text-primary shrink-0 mt-1" /><div><h2 className="font-medium">Know what goes into every answer.</h2><p className="text-sm text-muted-foreground mt-1">Autofill uses your selected resume. Review its facts before your next application.</p><Link href="/dashboard/resumes" className="text-sm text-primary inline-block mt-3 hover:underline">Review resume facts →</Link></div></section>
    </>}
  </div></DashboardLayout>
}
