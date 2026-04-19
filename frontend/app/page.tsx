'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Zap, Target, Rocket,
  CheckCircle, Shield, BarChart3, Globe,
} from 'lucide-react'

import { AINetworkBackground }  from '@/components/landing/ai-network'
import { AutoApplyDemo }        from '@/components/landing/auto-apply-demo'
import { ResumeScanAnimation }  from '@/components/landing/resume-scan'
import { CareerProgressPath }   from '@/components/landing/career-path'

// ─── Feature cards data ───────────────────────────────────────────────────────
const FEATURES = [
  { icon: Zap,       title: 'Instant Extraction',  description: 'Our AI reads job posts and extracts key requirements in milliseconds.' },
  { icon: Target,    title: 'Smart Matching',       description: 'Compare your profile against requirements with detailed semantic analysis.' },
  { icon: Rocket,    title: 'One-Click Apply',      description: 'Fill forms and generate tailored resumes instantly for every role.' },
  { icon: Shield,    title: 'Safe & Secure',        description: 'Your data is encrypted and managed with enterprise-grade security.' },
  { icon: BarChart3, title: 'Success Analytics',    description: 'Track your application funnel and see where you get the most traction.' },
  { icon: Globe,     title: 'Global Outreach',      description: 'Apply to jobs anywhere in the world, with auto-translations available.' },
]

const PRICING = [
  { name: 'Basics', price: '$0',  desc: 'Perfect for casual searchers.',   features: ['5 applications/month', 'Basic extraction', '1 stored resume'] },
  { name: 'Pro',    price: '$12', desc: 'For the serious job seeker.',     features: ['Unlimited applications', 'AI Match insights', 'Unlimited resumes', 'Priority API access'], highlight: true },
  { name: 'Edge',   price: '$24', desc: 'Everything and more.',            features: ['Auto-apply bot', 'Direct email outreach', 'Personal job concierge'] },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated, loading } = useAuth()
  const router   = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!loading && isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, loading, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <h1 className="text-2xl font-medium tracking-tight">Loading…</h1>
        </div>
      </div>
    )
  }

  const logoSrc = '/logo-dark.PNG'

  return (
    <div className="dark min-h-screen bg-background text-foreground selection:bg-primary/10">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logoSrc} alt="Applyr" className="h-8 w-auto object-contain transition-all" />
          </Link>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/auth/login" className="hidden sm:block">
              <Button variant="ghost" className="text-sm font-medium">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="rounded-full px-5 button-glow">Join Now</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── 1. HERO + AI NETWORK BACKGROUND ───────────────────────────── */}
        <section className="relative pt-32 pb-24 px-6 overflow-hidden">
          {/* AI Neural Network */}
          <AINetworkBackground />

          {/* Radial glow behind content */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(26,255,92,0.07) 0%, transparent 70%)',
            }}
          />

          <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              AI-Powered Job Applications
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[1.1] animate-reveal">
              The intelligent way to <br />
              <span className="text-primary">land your next role.</span>
            </h1>

            <p className="max-w-xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed animate-reveal stagger-1">
              Applyr automates the boring parts of job searching — AI-powered extraction,
              instant matching, and one-click applications.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 animate-reveal stagger-2">
              <Link href="/auth/register">
                <Button size="lg" className="rounded-full px-8 h-12 text-base font-medium button-glow group">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base font-medium button-outline-glow">
                  View Features
                </Button>
              </Link>
            </div>

            {/* Floating dashboard preview */}
            <div
              className="relative mt-20 p-2 rounded-2xl bg-border/20 border border-primary/20 animate-reveal stagger-3"
              style={{
                animation: 'float 6s ease-in-out infinite',
                boxShadow: '0 0 40px -10px rgba(26,255,92,0.2)',
              }}
            >
              <div className="bg-card rounded-xl border border-border shadow-2xl overflow-hidden aspect-[16/10] group">
                <img
                  src="/dashboard.png"
                  alt="Applyr Dashboard Preview"
                  className="w-full h-full object-cover object-top rounded-lg group-hover:scale-[1.01] transition-all duration-700"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. AUTO-APPLY DEMO SECTION ─────────────────────────────────── */}
        <section className="py-24 px-6 bg-secondary/10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 animate-reveal">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Zap size={12} /> Live Demo
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                Watch Applyr apply <br />
                <span className="text-primary">for you — live.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                From your resume to a submitted application in under 10 seconds.
                Our AI reads the job, extracts requirements, fills the form, and hits send.
              </p>
              <Link href="/auth/register">
                <Button className="button-glow gap-2 mt-2">
                  Try it yourself <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            {/* Auto-Apply Simulation */}
            <div className="animate-reveal stagger-1">
              <AutoApplyDemo />
            </div>
          </div>
        </section>

        {/* ── 3. FEATURE CARDS (hover energy effect) ────────────────────── */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 space-y-4 animate-reveal">
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">Focus on what matters.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We handle the manual labor of job applications so you can focus on building
                your skills and acing interviews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <div
                    key={i}
                    className="feature-energy-card group p-8 rounded-2xl border border-border/50 bg-card cursor-default
                               transition-all duration-300
                               hover:-translate-y-2 hover:border-primary/60
                               animate-reveal"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px 4px rgba(26,255,92,0.35)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = ''
                    }}
                  >
                    <div className="mb-5 inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10
                                    border border-primary/20 group-hover:bg-primary/20 group-hover:scale-110
                                    transition-all duration-300">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 tracking-tight group-hover:text-primary transition-colors duration-200">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── 4. AI RESUME SCANNER ──────────────────────────────────────── */}
        <section className="py-24 px-6 bg-secondary/10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Resume scan animation */}
            <div className="order-2 lg:order-1 animate-reveal">
              <ResumeScanAnimation />
            </div>

            <div className="order-1 lg:order-2 space-y-6 animate-reveal stagger-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Target size={12} /> Resume Intelligence
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                Your resume, <br />
                <span className="text-primary">decoded by AI.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Upload once. Applyr reads every skill, role, and achievement —
                then intelligently maps your experience to each job's requirements.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {['Instant skill extraction', 'Experience timeline parsing', 'Keyword gap analysis'].map(pt => (
                  <li key={pt} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-primary" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 5. CAREER PROGRESS PATH ───────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-12 animate-reveal">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                <Rocket size={12} /> Career Acceleration
              </div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
                From upload to offer — <br />
                <span className="text-primary">faster than ever.</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                Applyr compresses weeks of manual effort into minutes, so you hit every milestone on the path to your next role.
              </p>
            </div>

            <CareerProgressPath />
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────────────────────── */}
        <section className="py-24 px-6 bg-secondary/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-2 animate-reveal">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Simple, honest pricing.</h2>
              <p className="text-muted-foreground">Free for individuals, built to scale with your career.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PRICING.map((p, i) => (
                <div
                  key={i}
                  className={`flex flex-col p-8 rounded-2xl border card-lift animate-reveal stagger-${i + 1} ${
                    p.highlight ? 'border-primary ring-1 ring-primary/20 bg-background' : 'border-border bg-card'
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground pb-1">{p.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 h-10">{p.desc}</p>
                  <Button className={`w-full mb-8 button-glow ${!p.highlight ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}`}>
                    Select {p.name}
                  </Button>
                  <ul className="space-y-4 flex-1">
                    {p.features.map(f => (
                      <li key={f} className="text-sm flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div
            className="max-w-4xl mx-auto text-center space-y-8 rounded-3xl p-12 md:p-20 border border-primary/30 bg-card/80 backdrop-blur-md animate-reveal"
            style={{ boxShadow: '0 0 40px -10px rgba(26,255,92,0.15)' }}
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
              Ready to start applying?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg leading-relaxed">
              Join 10,000+ job seekers using Applyr to automate their career growth.
            </p>
            <div className="pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="rounded-full px-10 h-14 text-lg button-glow">
                  Create Your Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="py-20 border-t border-border/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1 space-y-6">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <img src={logoSrc} alt="Applyr Logo" className="h-6 w-auto object-contain" />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Automating the manual labor of job applications since 2024.
              </p>
            </div>
            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Roadmap'] },
              { heading: 'Company', links: ['About', 'Careers', 'Privacy'] },
              { heading: 'Support',  links: ['Help Center', 'Contact', 'Status'] },
            ].map(col => (
              <div key={col.heading}>
                <h4 className="text-sm font-semibold mb-4">{col.heading}</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {col.links.map(l => (
                    <li key={l}><Link href="#" className="hover:text-foreground transition-colors">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-border/20 text-xs text-muted-foreground flex justify-between items-center">
            <p>© 2024 Applyr Labs. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-foreground transition-colors">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
