'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Check, FileText, Pause, Play, ScanLine } from 'lucide-react'

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Content stays visible without JavaScript or observer support.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { element.dataset.reveal = 'visible'; observer.disconnect() }
    }, { threshold: 0.12 })
    element.dataset.reveal = 'pending'
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return <div ref={setElement} className={`landing-reveal ${className}`}>{children}</div>
}

const stages = [
  { label: 'Find the fact', title: 'Start with your experience.', caption: 'A suggestion grounded in your selected resume.', status: 'Resume source found' },
  { label: 'Review the answer', title: 'Make the answer yours.', caption: 'Read the source, edit the wording, then confirm your review.', status: 'Example: reviewed by you' },
  { label: 'Fill the field', title: 'A little less repetition.', caption: 'The reviewed answer goes into a supported field. You submit.', status: 'Example: field filled · not submitted' },
]

export function WorkflowDemo() {
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPlaying(!preference.matches)
    const change = () => setPlaying(!preference.matches)
    preference.addEventListener('change', change)
    return () => preference.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => { if (!document.hidden) setStage(value => (value + 1) % stages.length) }, 4500)
    return () => window.clearInterval(timer)
  }, [playing])
  const current = stages[stage]
  return <div className="demo-scene">
    <div className="demo-orbit" aria-hidden="true" />
    <div className="demo-paper" aria-hidden="true"><FileText size={20} /><span>My engineering resume</span><span className="ml-auto text-xs">PDF</span></div>
    <div className="demo-window">
      <div className="flex items-center justify-between border-b px-5 py-4 gap-3"><span className="text-sm font-semibold flex items-center gap-2"><ScanLine size={17} className="text-primary" /> Applyr workspace</span><span className="text-[11px] text-muted-foreground rounded-full border px-2 py-1">Illustrative demo</span></div>
      <div className="p-5 sm:p-7">
        <div className="flex gap-2 mb-7" aria-label="Demo steps">{stages.map((item, index) => <button key={item.label} onClick={() => { setStage(index); setPlaying(false) }} aria-pressed={stage === index} className={`demo-step ${stage === index ? 'is-active' : ''}`}><span className="block text-xs mb-2">0{index + 1}</span><span>{item.label}</span></button>)}</div>
        <div key={stage} className="demo-content">
          <p className="text-xs text-primary font-medium mb-2">YOUR EXPERIENCE, CONNECTED</p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{current.title}</h2>
          <p className="text-sm text-muted-foreground mt-2 min-h-12">{current.caption}</p>
          <div className={`demo-source ${stage === 0 ? 'is-highlighted' : ''}`}><span className="flex items-center gap-2 text-xs font-semibold text-primary"><FileText size={14} /> Resume / Projects</span><p className="text-sm mt-2">Project directory · Python · Search & filters</p></div>
          <div className="flex justify-center py-3 text-primary" aria-hidden="true"><ArrowRight size={18} className="rotate-90" /></div>
          <div className={`demo-answer ${stage === 2 ? 'is-filled' : ''}`}><p className="text-xs font-medium text-muted-foreground mb-3">Tell us about a project you built.</p><p className="text-sm leading-relaxed">{stage === 0 ? 'Your resume fact becomes a suggested answer here.' : 'I built a searchable project directory using Python, with filters to help users find relevant work.'}</p></div>
          <p className="flex items-center gap-2 text-xs font-medium text-primary mt-4 min-h-8"><Check size={16} className="shrink-0" />{current.status}</p>
        </div>
      </div>
      <div className="border-t px-5 py-3 flex items-center justify-between gap-3 bg-secondary/40"><span className="text-xs text-muted-foreground">Review → Fill → Submit yourself</span><button className="demo-play" onClick={() => setPlaying(value => !value)} aria-label={playing ? 'Pause workflow animation' : 'Play workflow animation'}>{playing ? <Pause size={14} /> : <Play size={14} />}<span>{playing ? 'Pause' : 'Play'}</span></button></div>
    </div>
    <div className="demo-note"><span className="h-2 w-2 rounded-full bg-primary" /> Your experience. Your final say.</div>
  </div>
}
