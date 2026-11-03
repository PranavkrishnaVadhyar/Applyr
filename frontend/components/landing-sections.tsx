import Link from 'next/link'
import { ArrowRight, Check, FileText, FolderOpen, ListChecks, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/components/landing-experience'
import { Button } from '@/components/ui/button'

const heading = 'font-display text-3xl md:text-4xl font-semibold tracking-tight'
const eyebrow = 'text-xs uppercase tracking-[0.18em] font-semibold text-primary mb-4'

export function LandingSections() {
  return <>
    <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
      <Reveal><p className={eyebrow}>Less admin. More attention.</p><h2 className={heading}>Keep your energy for the opportunity.</h2>
        <div className="grid md:grid-cols-3 gap-8 mt-12">{[
          ['The same details. Again.', 'Start from your resume.', 'Use saved resume facts to suggest answers for supported fields, then review what goes into the form.'],
          ['That answer you wrote yesterday.', 'Keep the work you’ve done.', 'Save reviewed answers with an application draft and restore them on matching questions and pages.'],
          ['Another job lost in another tab.', 'Give each application a place.', 'Keep job details, the selected resume and the application stage together in your tracker.'],
        ].map(([problem, title, copy]) => <article key={title} className="border-t-2 border-primary/25 pt-6"><p className="text-sm text-muted-foreground mb-3">{problem}</p><h3 className="text-xl font-semibold mb-3">{title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{copy}</p></article>)}</div>
      </Reveal>
    </section>

    <section id="answer-sources" className="bg-secondary/40 border-y">
      <Reveal className="max-w-7xl mx-auto px-6 py-20 md:py-24">
        <div className="max-w-2xl"><p className={eyebrow}>See where the words come from</p><h2 className={heading}>Your experience is the starting point.</h2><p className="text-muted-foreground mt-5">Straightforward facts can come directly from your selected resume. For open-ended questions, optional AI drafts help with wording. Both deserve your review.</p></div>
        <p className="text-xs text-muted-foreground mt-8 mb-4">Illustrative example · fictional resume content and answers</p>
        <div className="grid lg:grid-cols-3 gap-4">{[
          ['01 / Resume excerpt', 'The source', 'Built a searchable project directory in Python with category filters.', 'Saved under Projects in your selected resume.'],
          ['02 / Optional AI draft', 'A starting point', 'I built a Python project directory that lets users search and filter projects by category.', 'Generated wording can be wrong. Compare it with the source.'],
          ['03 / Your edit', 'Your final answer', 'I built a project directory in Python, adding search and category filters to make projects easier to find.', 'Edit for accuracy and voice, then explicitly mark it reviewed.'],
        ].map(([step, title, answer, note]) => <article key={step} className="rounded-xl border bg-card p-6 flex flex-col"><p className="text-xs text-primary font-medium">{step}</p><h3 className="text-lg font-semibold mt-3 mb-5">{title}</h3><blockquote className="text-sm leading-relaxed border-l-2 border-primary/30 pl-4 flex-1">“{answer}”</blockquote><p className="text-xs text-muted-foreground mt-6">{note}</p></article>)}</div>
        <p className="text-sm text-muted-foreground mt-6 flex items-start gap-2"><ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />Missing information needs your input. A polished answer should never become an invented qualification.</p>
      </Reveal>
    </section>

    <section id="workspace" className="max-w-7xl mx-auto px-6 py-20 md:py-28">
      <Reveal><div className="md:flex justify-between items-end gap-8"><div><p className={eyebrow}>A place for every next step</p><h2 className={heading}>Meet your application workspace.</h2></div><p className="text-xs text-muted-foreground mt-5">Illustrative previews · sample data, not screenshots</p></div>
        <div className="grid lg:grid-cols-3 gap-6 mt-10">
          <article className="rounded-2xl border overflow-hidden bg-card"><div className="bg-secondary/50 p-6 min-h-56"><div className="flex items-center gap-2 text-sm font-semibold mb-5"><FolderOpen size={17} />Resume library</div><div className="rounded-lg border bg-card p-4"><p className="flex gap-2 items-center text-sm"><FileText size={16} className="text-primary" />Engineering resume.pdf</p><p className="text-xs text-muted-foreground mt-3">Projects · Experience · Skills</p><p className="text-xs text-primary mt-4">Check extracted facts →</p></div></div><div className="p-6"><h3 className="font-semibold text-lg">Choose the right source.</h3><p className="text-sm text-muted-foreground mt-3">Upload and correct your resume, compare it with the original, and choose which version to use in the extension.</p></div></article>
          <article className="rounded-2xl border overflow-hidden bg-card"><div className="bg-secondary/50 p-6 min-h-56"><div className="flex items-center gap-2 text-sm font-semibold mb-5"><ShieldCheck size={17} />Answer review</div><div className="rounded-lg border bg-card p-4"><p className="text-xs text-primary">Resume fact / Contact details</p><p className="text-sm mt-3">Alex Morgan</p><p className="text-xs text-muted-foreground flex items-center gap-2 mt-4"><Check size={14} />Example: reviewed before filling</p></div></div><div className="p-6"><h3 className="font-semibold text-lg">Keep the context beside you.</h3><p className="text-sm text-muted-foreground mt-3">Use the Chrome side panel to inspect sources and edit suggestions while the application form stays open.</p></div></article>
          <article className="rounded-2xl border overflow-hidden bg-card"><div className="bg-secondary/50 p-6 min-h-56"><div className="flex items-center gap-2 text-sm font-semibold mb-5"><ListChecks size={17} />Application tracker</div><div className="rounded-lg border bg-card divide-y">{[['Product engineer', 'Draft'], ['Frontend engineer', 'Applied']].map(([role, status]) => <div key={role} className="p-4 flex flex-wrap gap-2 justify-between text-xs"><span>{role}</span><span className="text-primary">{status}</span></div>)}</div></div><div className="p-6"><h3 className="font-semibold text-lg">Know where things stand.</h3><p className="text-sm text-muted-foreground mt-3">Search your applications, filter by stage, and open the saved job details, answers and linked resume.</p></div></article>
        </div>
      </Reveal>
    </section>

    <section className="border-y bg-card"><Reveal className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-start">
      <div><p className={eyebrow}>Life happens between applications</p><h2 className={heading}>Pause now.<br />Pick up with context.</h2><p className="text-muted-foreground mt-5">Save the job, your selected resume and reviewed answers as a tracker draft. When you return, restore the draft and review answers again before filling.</p></div>
      <div className="space-y-6"><div className="rounded-xl border border-primary/25 bg-primary/5 p-6"><h3 className="font-semibold">Save to tracker for later</h3><p className="text-sm text-muted-foreground mt-2">An explicit save keeps the draft on the backend so it remains available after you close the browser or sign out.</p></div><div className="px-6"><h3 className="font-semibold">Session recovery is a safety net</h3><p className="text-sm text-muted-foreground mt-2">The extension can recover unsaved edits within the browser session. Recovery is cleared on sign-out or a new sign-in. Save to the tracker for durable storage.</p></div></div>
    </Reveal></section>

    <section className="max-w-7xl mx-auto px-6 py-20 md:py-28"><Reveal className="grid md:grid-cols-2 gap-12">
      <div><p className={eyebrow}>Assistance with clear boundaries</p><h2 className={heading}>You stay in control.</h2><p className="text-muted-foreground mt-5">Applyr helps prepare and fill answers. You decide what represents you and when an application is ready to send.</p><Link href="/data" className="inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4 mt-6">See how your data is used <ArrowRight size={15} /></Link></div>
      <ul className="space-y-6">{[
        ['Choose your source', 'Suggestions use the resume selected in the extension. Editing your account profile does not change your resume.'],
        ['Inspect and edit', 'Read the available source evidence and adjust suggested wording before marking an answer reviewed.'],
        ['Submit on your terms', 'Applyr does not submit employer forms. Unsupported fields and questions remain yours to complete manually.'],
      ].map(([title, copy]) => <li key={title} className="flex gap-4"><Check size={19} className="text-primary shrink-0 mt-1" /><div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground mt-2">{copy}</p></div></li>)}</ul>
    </Reveal></section>

    <section id="get-started" className="border-y bg-secondary/40"><Reveal className="max-w-7xl mx-auto px-6 py-20 md:py-24"><p className={eyebrow}>A small first step</p><h2 className={heading}>Get ready before the real application.</h2>
      <ol className="grid md:grid-cols-3 gap-8 mt-10">{[
        ['Create your account', 'Sign in to keep your resume records and application drafts together.', '/auth/register', 'Create an account'],
        ['Upload and check your resume', 'Review the extracted details and correct any mistakes before using them for suggestions.', '/dashboard/resumes', 'Open resume library'],
        ['Set up and practice', 'Install the Chrome extension locally, then review and fill answers on a safe practice form.', '/dashboard/setup', 'View setup steps'],
      ].map(([title, copy, href, action], index) => <li key={title}><span className="font-display text-4xl text-primary/60">0{index + 1}</span><h3 className="text-lg font-semibold mt-4">{title}</h3><p className="text-sm text-muted-foreground mt-3 mb-5">{copy}</p><Link href={href} className="text-sm text-primary underline underline-offset-4">{action}</Link></li>)}</ol>
      <p className="text-sm text-muted-foreground border-t pt-6 mt-10">Current setup: Chrome 116 or newer, the project’s unpacked extension loaded through Developer mode, and a local backend running on port 8000. <Link href="/practice" className="text-primary underline underline-offset-4">Explore the practice form</Link>—it does not send an application to an employer.</p>
    </Reveal></section>

    <section id="faq" className="max-w-4xl mx-auto px-6 py-20 md:py-28"><Reveal><p className={eyebrow}>Before you begin</p><h2 className={`${heading} mb-10`}>A few things worth knowing.</h2><div className="divide-y border-y">{[
      ['Does Applyr submit applications for me?', 'No. It fills supported fields with answers you have reviewed. You check the employer’s form and submit it yourself. Filling a form and recording an application as submitted are separate actions.'],
      ['Does it work on every website?', 'No. Applyr supports a range of labeled fields, including text inputs, native selects and some custom controls. Site restrictions, unsupported widgets and some embedded forms may require manual input.'],
      ['Can I edit suggested answers?', 'Yes. Edit suggestions before filling. Editing an answer removes its review confirmation so you can check it again. You can also correct extracted resume facts in your resume library.'],
      ['Is AI required?', 'AI answer drafting is optional; supported factual suggestions can use your saved resume directly. Resume extraction and job-text extraction still use AI services. Turning off answer drafting does not disable those services.'],
      ['Where is my resume stored?', 'Applyr uses Supabase for resume files and records. Uploads are sent to LlamaCloud for extraction. Job extraction and optional answer drafting use Groq. The data-handling page explains what is stored and sent to these services.'],
      ['Will I lose my work if I close the extension?', 'Saved tracker drafts remain on the backend. Unsaved edits have browser-session recovery, which is temporary and cleared on sign-out or a new sign-in. Use Save to tracker before leaving work you want to keep.'],
      ['How do I install the extension?', 'The current version is installed locally with Chrome’s Load unpacked option, using the project’s chrome_extension folder. It requires Chrome 116 or newer and the local backend. Follow the setup guide after signing in.'],
    ].map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer font-medium flex items-center justify-between gap-6 list-none [&::-webkit-details-marker]:hidden">{question}<span aria-hidden="true" className="text-primary text-xl group-open:rotate-45 transition-transform">+</span></summary><p className="text-sm text-muted-foreground leading-relaxed mt-4 pr-6">{answer}</p></details>)}</div><Link href="/data" className="inline-block mt-6 text-sm text-primary underline underline-offset-4">Read the full data-handling explanation</Link></Reveal></section>

    <section className="max-w-7xl mx-auto px-6 pb-20 md:pb-28"><Reveal className="landing-closing text-center space-y-5"><p className={eyebrow}>Your next chapter starts with you</p><h2 className={heading}>Bring your experience.<br />Leave some repetition behind.</h2><p className="text-muted-foreground">Start with a resume you’ve checked. Build answers you’re comfortable sending. Keep your next step in sight.</p><div className="pt-4"><Button asChild size="lg"><Link href="/auth/register">Start with your resume <ArrowRight size={16} /></Link></Button></div></Reveal></section>
  </>
}
