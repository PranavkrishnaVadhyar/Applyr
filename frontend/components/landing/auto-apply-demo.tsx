'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, FileText, Zap, BriefcaseIcon } from 'lucide-react'

const STEPS = [
  { id: 0, label: 'Resume loaded',       detail: 'senior-dev-resume.pdf',        icon: FileText },
  { id: 1, label: 'AI analysing job…',   detail: 'Matching skills & keywords',   icon: Zap },
  { id: 2, label: 'Form auto-filling…',  detail: 'Name, experience, skills…',    icon: BriefcaseIcon },
  { id: 3, label: 'Application sent ✓',  detail: 'Google · Senior Engineer',     icon: CheckCircle },
]

export function AutoApplyDemo() {
  const [step, setStep]         = useState(0)
  const [typing, setTyping]     = useState('')
  const [done, setDone]         = useState(false)
  const typingTarget = 'Filling cover letter via AI…'

  useEffect(() => {
    const cycle = () => {
      setStep(0); setTyping(''); setDone(false)

      const timers: ReturnType<typeof setTimeout>[] = []
      timers.push(setTimeout(() => setStep(1), 1200))
      timers.push(setTimeout(() => setStep(2), 2400))
      // Type text letter by letter
      timers.push(setTimeout(() => {
        let i = 0
        const id = setInterval(() => {
          setTyping(typingTarget.slice(0, i + 1))
          i++
          if (i >= typingTarget.length) clearInterval(id)
        }, 40)
      }, 2600))
      timers.push(setTimeout(() => { setStep(3); setDone(true) }, 4200))
      return timers
    }

    const initial = cycle()
    const interval = setInterval(() => cycle(), 6500)
    return () => {
      initial.forEach(clearTimeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl border border-primary/20 bg-card p-5 space-y-3 text-sm font-mono select-none"
         style={{ boxShadow: 'var(--shadow-neon)' }}>
      {/* Title bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
        <span className="ml-2 text-muted-foreground text-xs">applyr · auto-apply</span>
      </div>

      {STEPS.map((s) => {
        const Icon = s.icon
        const isActive  = step === s.id
        const isPast    = step > s.id
        const isDone    = s.id === 3 && done

        return (
          <div
            key={s.id}
            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-500 ${
              isActive ? 'bg-primary/10 border border-primary/30' :
              isPast   ? 'opacity-50'                              : 'opacity-20'
            }`}
          >
            <Icon
              size={16}
              className={`mt-0.5 flex-shrink-0 transition-colors duration-300 ${
                isDone    ? 'text-primary' :
                isActive  ? 'text-primary animate-pulse' :
                            'text-muted-foreground'
              }`}
            />
            <div>
              <p className={`font-semibold text-xs ${isActive || isPast ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {s.id === 2 && isActive ? typing || s.detail : s.detail}
              </p>
            </div>
            {isPast && !isDone && (
              <CheckCircle size={13} className="ml-auto text-primary flex-shrink-0 mt-0.5" />
            )}
            {isDone && s.id === 3 && (
              <span className="ml-auto text-primary text-[11px] font-bold animate-pulse">DONE</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
