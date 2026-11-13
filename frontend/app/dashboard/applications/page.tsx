'use client'

import { useEffect, useState, useRef } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ArrowRight, FileText, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { applicationsApi, Application, ReviewedAnswer } from '@/lib/applications-api'

const statusColors: Record<string, string> = {
  applied: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  interviewing: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  offer: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  draft: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
}

export default function ApplicationsPage() {
  const { user } = useAuth()
  const opener = useRef<HTMLElement | null>(null)
  const [detailTab, setDetailTab] = useState('overview')
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const visibleApplications = applications.filter(app =>
    (statusFilter === 'all' || app.status === statusFilter) &&
    `${app.company_name} ${app.job_role} ${app.job_description}`.toLowerCase().includes(search.trim().toLowerCase()))
  async function changeStatus(app: Application, status: string) {
    setBusyId(app.id); setActionError(null)
    try {
      const updated = await applicationsApi.updateStatus(app.id, status)
      setApplications(items => items.map(item => item.id === app.id ? updated : item))
      setSelectedApp(item => item?.id === app.id ? updated : item)
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Could not update status.') }
    finally { setBusyId(null) }
  }
  async function deleteApplication() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id); setActionError(null)
    try {
      await applicationsApi.deleteApplication(deleteTarget.id)
      setApplications(items => items.filter(item => item.id !== deleteTarget.id))
      setSelectedApp(item => item?.id === deleteTarget.id ? null : item)
      setDeleteTarget(null)
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Could not delete application.') }
    finally { setBusyId(null) }
  }

  useEffect(() => {
    let cancelled = false
    let loading = false
    async function fetchApplications() {
      if (!user || loading || busyId) return
      loading = true
      
      try {
        setLoadError(null)
        const apps = await applicationsApi.getUserApplications(user.id)
        if (cancelled) return
        setApplications(apps)
        setSelectedApp(current => current ? apps.find(app => app.id === current.id) ?? null : null)
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load applications. Reload to try again.')
      } finally {
        loading = false
        if (!cancelled) setIsLoading(false)
      }
    }

    if (user) {
      fetchApplications()
    } else {
      setApplications([]); setSelectedApp(null)
      setIsLoading(false)
    }
    const refresh = () => { if (document.visibilityState === 'visible') void fetchApplications() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { cancelled = true; window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [user, refreshVersion, busyId])

  const date = (value?: string | null) => value ? new Date(value).toLocaleDateString() : '—'
  return <DashboardLayout><div className="space-y-6">
    <Button variant="outline" disabled={busyId !== null} onClick={() => setRefreshVersion(value => value + 1)}>Refresh applications</Button>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-primary text-xs uppercase tracking-widest font-semibold mb-3">Keep your place</p><h1 className="font-display text-3xl font-semibold tracking-tight">Applications</h1><p className="text-muted-foreground mt-2">Every role, the answers you reviewed, and what comes next.</p></div><Button asChild variant="outline"><Link href="/dashboard/setup">Save a job with the extension</Link></Button></div>
    <div className="rounded-xl border bg-card p-4 flex flex-wrap items-center gap-3"><div className="relative flex-1 min-w-48"><Search size={17} className="absolute left-3 top-3 text-muted-foreground" /><Input aria-label="Search applications" placeholder="Search company or role…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div><select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="all">All stages</option>{Object.keys(statusColors).map(status => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select>{(search || statusFilter !== 'all') && <Button variant="ghost" onClick={() => { setSearch(''); setStatusFilter('all') }}>Clear filters</Button>}</div>
    <p role="status" className="text-sm text-muted-foreground">{isLoading ? 'Loading applications…' : loadError ? 'Applications unavailable' : `${visibleApplications.length} of ${applications.length} applications`}</p>
    {(loadError || actionError) && <p role="alert" className="text-sm text-destructive">{loadError || actionError}</p>}
    {!isLoading && !loadError && !visibleApplications.length && <div className="rounded-xl border border-dashed p-10 text-center"><FileText className="mx-auto text-primary mb-3" size={26} /><h2 className="font-semibold">{applications.length ? 'No matching applications' : 'Make room for your next opportunity.'}</h2><p className="text-muted-foreground mt-2 text-sm">{applications.length ? 'Try another search or clear your filters.' : 'Save your first job in the extension. Your progress and reviewed answers will appear here.'}</p></div>}
    {!!visibleApplications.length && <div className="rounded-xl border bg-card overflow-hidden"><div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-secondary/50 text-xs text-muted-foreground font-medium"><span>Company & role</span><span>Stage</span><span>Applied</span><span>Updated</span><span>Details</span></div>{visibleApplications.map(app => <div key={app.id} className="flex flex-wrap md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-5 border-t first:border-t-0"><button className="text-left min-w-0 flex-1" onClick={e => { opener.current = e.currentTarget; setSelectedApp(app); setDetailTab('overview') }}><span className="block font-medium hover:text-primary">{app.job_role}</span><span className="block text-sm text-muted-foreground">{app.company_name}</span></button><span className="capitalize text-xs font-medium rounded-full bg-secondary px-3 py-1 w-fit">{app.status}</span><span className="hidden md:block text-sm text-muted-foreground">{date(app.applied_at)}</span><span className="hidden md:block text-sm text-muted-foreground">{date(app.updated_at || app.created_at)}</span><Button variant="ghost" size="sm" aria-label={`View ${app.job_role} at ${app.company_name}`} onClick={e => { opener.current = e.currentTarget; setSelectedApp(app); setDetailTab('overview') }}><ArrowRight size={17} /></Button></div>)}</div>}
  </div>
    <Sheet open={!!selectedApp} onOpenChange={open => { if (!open) setSelectedApp(null) }}><SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0" onCloseAutoFocus={e => { e.preventDefault(); opener.current?.focus() }}>
      <SheetHeader className="p-6 pr-12 border-b"><SheetTitle className="font-display text-2xl">{selectedApp?.job_role}</SheetTitle><SheetDescription>{selectedApp?.company_name}</SheetDescription></SheetHeader>
      {selectedApp && <div className="px-6 pb-8 space-y-6">{actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}<label className="flex items-center justify-between gap-4 text-sm">Stage<select value={selectedApp.status} disabled={busyId !== null} onChange={e => changeStatus(selectedApp, e.target.value)} className="border border-input bg-background rounded-md p-2">{Object.keys(statusColors).map(status => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>
        <Tabs value={detailTab} onValueChange={setDetailTab}><TabsList className="w-full"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="answers">Answers</TabsTrigger><TabsTrigger value="resume">Resume</TabsTrigger></TabsList>
          <TabsContent value="overview" className="space-y-5 pt-4"><dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted-foreground">Applied</dt><dd>{date(selectedApp.applied_at)}</dd></div><div><dt className="text-muted-foreground">Deadline</dt><dd>{date(selectedApp.final_date)}</dd></div></dl>{typeof selectedApp.response?.job_url === 'string' && /^https?:\/\//i.test(selectedApp.response.job_url) && <a href={selectedApp.response.job_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline inline-block">Open job posting ↗</a>}<div><h3 className="font-semibold mb-2">About the role</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedApp.job_description || 'No description saved.'}</p></div>{selectedApp.company_description && <div><h3 className="font-semibold mb-2">About the company</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedApp.company_description}</p></div>}<p className="text-xs text-muted-foreground">Applied means you marked this application as submitted, or the extension detected a supported confirmation. Check the employer’s confirmation for certainty.</p></TabsContent>
          <TabsContent value="answers" className="space-y-4 pt-4"><p className="text-sm text-muted-foreground">Your saved answers. Draft answers still need review. Edits made directly on the employer’s website are not captured.</p>{selectedApp.response?.version === 1 && Array.isArray(selectedApp.response.answers) && selectedApp.response.answers.length ? selectedApp.response.answers.filter((answer: ReviewedAnswer) => typeof answer?.label === 'string' && typeof answer?.value === 'string').map((answer: ReviewedAnswer, i: number) => <div key={i} className="rounded-lg border p-4"><h3 className="font-medium text-sm">{answer.label}</h3><p className="text-xs text-primary mt-2">{answer.reviewed === false ? "Draft · needs review" : "Reviewed"}</p>{typeof answer.page_url === "string" && /^https?:\/\//i.test(answer.page_url) && <a href={answer.page_url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-muted-foreground">Source form</a>}<p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{answer.value}</p></div>) : <div className="rounded-lg bg-secondary p-5 text-sm">No answers saved yet. Open this draft in the extension to get started.</div>}</TabsContent>
          <TabsContent value="resume" className="space-y-4 pt-4"><FileText className="text-primary" size={28} /><h3 className="font-semibold">{typeof selectedApp.response?.resume_filename === 'string' ? selectedApp.response.resume_filename : selectedApp.resume_id ? 'Linked resume' : 'No resume linked'}</h3><p className="text-sm text-muted-foreground">The selected resume supplies your autofill facts. Review corrections in the resume library before using it again.</p><Button variant="outline" asChild><Link href="/dashboard/resumes">Open resume library</Link></Button></TabsContent>
        </Tabs><div className="border-t pt-5"><Button variant="ghost" className="text-destructive" disabled={busyId !== null} onClick={() => setDeleteTarget(selectedApp)}><Trash2 size={16} /> Delete application</Button></div>
      </div>}
    </SheetContent></Sheet>
    <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open && !busyId) setDeleteTarget(null) }}><DialogContent><DialogTitle>Delete this application?</DialogTitle><DialogDescription>{deleteTarget?.job_role} at {deleteTarget?.company_name}. Its saved answers will be deleted. Your resume is kept.</DialogDescription>{actionError && <p role="alert" className="text-destructive text-sm">{actionError}</p>}<div className="flex justify-end gap-3"><Button variant="outline" disabled={busyId !== null} onClick={() => setDeleteTarget(null)}>Keep application</Button><Button variant="destructive" disabled={busyId !== null} onClick={deleteApplication}>{busyId ? 'Deleting…' : 'Delete application'}</Button></div></DialogContent></Dialog>
  </DashboardLayout>
}
