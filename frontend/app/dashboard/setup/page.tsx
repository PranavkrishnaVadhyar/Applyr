import Link from 'next/link'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
export default function SetupPage() {
  return <DashboardLayout><div className="max-w-3xl space-y-8"><div><p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">Get ready to apply</p><h1 className="font-display text-3xl font-semibold">Your first application, step by step.</h1><p className="text-muted-foreground mt-3">Applyr currently uses a locally installed Chrome extension. Installation status is not automatically detected.</p></div>
    <ol className="space-y-4">{[
      ['01', 'Review your resume', 'Upload a resume and correct the extracted facts. These are the source for autofill.', '/dashboard/resumes', 'Open resume library'],
      ['02', 'Connect the Chrome extension', 'In chrome://extensions, enable Developer mode, choose Load unpacked, and select the project’s chrome_extension folder. Keep the local backend running on port 8000. Open Applyr from the toolbar and sign in.', '', ''],
      ['03', 'Try a practice form', 'Use a safe sample page to find, review and fill answers. It will not send an application to an employer.', '/practice', 'Open practice form'],
    ].map(([number,title,text,href,action]) => <li key={number} className="rounded-xl border bg-card p-6 flex gap-5"><span className="font-display text-primary font-semibold">{number}</span><div><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground mt-2 leading-relaxed">{text}</p>{href && <Button variant="outline" className="mt-4" asChild><Link href={href}>{action}</Link></Button>}</div></li>)}</ol>
    <p className="text-sm text-muted-foreground">On supported forms, you can fill reviewed answers and save a draft. Unsupported fields stay available for you to answer manually. No form is submitted automatically.</p>
  </div></DashboardLayout>
}
