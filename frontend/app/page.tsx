import Link from 'next/link'
import { LandingSections } from '@/components/landing-sections'
import { Reveal, WorkflowDemo } from '@/components/landing-experience'
import { ArrowRight, FileText, ShieldCheck, ListChecks } from 'lucide-react'
import { Brand } from '@/components/brand'
import { ThemeSelect } from '@/components/theme-select'
import { Button } from '@/components/ui/button'

export default function Home() {
  return <div className="landing-page min-h-screen bg-background text-foreground">
    <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-6">
      <Brand /><nav aria-label="Main navigation" className="flex items-center gap-5 text-sm"><Link href="#how-it-works" className="hidden sm:block">How it works</Link><Link href="#faq" className="hidden sm:block">FAQ</Link><Link href="/auth/login">Sign in</Link><Button asChild><Link href="/auth/register">Get started <ArrowRight size={16} /></Link></Button></nav>
    </header>
    <main>
      <div className="landing-hero-wrap">
      <section className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-14 xl:gap-20 items-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <Reveal className="space-y-7">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">Your next chapter, with less busywork</p>
          <h1 className="font-display text-[clamp(2.1rem,7.8vw,3rem)] sm:text-6xl xl:text-7xl leading-[1.07] tracking-[-0.045em] font-semibold">Less repetition.<br /><span className="hero-accent">More possibility.</span></h1>
          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">Turn your resume into answers you can review. Fill supported forms, save your progress, and keep every application in one place.</p>
          <div className="flex flex-wrap gap-3"><Button size="lg" asChild><Link href="/auth/register">Start with your resume <ArrowRight size={16} /></Link></Button><Button size="lg" variant="outline" asChild><Link href="#how-it-works">See how it works</Link></Button></div>
          <p className="text-sm text-muted-foreground flex items-center gap-2"><ShieldCheck size={18} className="text-primary" /> You review the answers. You submit the application.</p>
        </Reveal>
        <Reveal><WorkflowDemo /></Reveal>
      </section>
      </div>
      <section id="how-it-works" className="border-y border-border bg-card">
        <Reveal className="max-w-7xl mx-auto px-6 py-20 md:py-24"><p className="text-xs uppercase tracking-widest font-semibold text-primary">A little help at every step</p><h2 className="font-display text-3xl font-semibold tracking-tight mt-3 mb-10">From your resume to your next application.</h2>
          <div className="grid md:grid-cols-3 gap-5">{[
            { icon: FileText, title: 'Bring your experience', text: 'Upload a resume and check the extracted facts. Correct anything that needs attention.' },
            { icon: ShieldCheck, title: 'Review before you fill', text: 'Choose your resume, edit suggested answers and see their sources. AI drafts are optional.' },
            { icon: ListChecks, title: 'Keep your place', text: 'Save a draft and its reviewed answers. Track progress after you submit on the employer’s website.' },
          ].map((step, i) => <div key={step.title} className="landing-feature space-y-4"><div className="flex gap-3 items-center text-primary"><step.icon size={22} /><span className="text-xs font-semibold">0{i + 1}</span></div><h3 className="text-lg font-semibold">{step.title}</h3><p className="text-muted-foreground text-sm leading-relaxed">{step.text}</p></div>)}</div>
        </Reveal>
      </section>
      <LandingSections />
    </main>
    <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-border flex flex-wrap items-center justify-between gap-6"><Brand /><p className="text-sm text-muted-foreground">A calmer way to keep moving forward.</p><ThemeSelect /></footer>
  </div>
}
