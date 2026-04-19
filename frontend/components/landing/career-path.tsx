'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  { label: 'Upload Resume',  icon: '📄' },
  { label: 'AI Optimises',   icon: '🤖' },
  { label: 'Auto Apply',     icon: '⚡' },
  { label: 'Interview',      icon: '🎯' },
  { label: 'Offer',          icon: '🏆' },
]

export function CareerProgressPath() {
  const [active, setActive] = useState(-1)

  useEffect(() => {
    let i = 0
    const tick = () => {
      setActive(i)
      i++
      if (i < STEPS.length) {
        setTimeout(tick, 900)
      } else {
        // Restart cycle
        setTimeout(() => { setActive(-1); i = 0; setTimeout(tick, 400) }, 2400)
      }
    }
    const startId = setTimeout(tick, 600)
    return () => clearTimeout(startId)
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      {/* Horizontal connector + steps */}
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-border/50" />
        {/* Animated fill line */}
        <div
          className="absolute top-5 left-0 h-[2px] bg-primary transition-all duration-700"
          style={{
            width: active < 0 ? '0%' : `${(active / (STEPS.length - 1)) * 100}%`,
            boxShadow: '0 0 6px 2px rgba(26,255,92,0.5)',
          }}
        />

        {STEPS.map((s, i) => {
          const isActive = i === active
          const isPast   = i < active

          return (
            <div key={i} className="relative flex flex-col items-center gap-2 z-10">
              {/* Circle node */}
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 text-lg ${
                  isActive
                    ? 'border-primary bg-primary/20 scale-125'
                    : isPast
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                }`}
                style={isActive ? { boxShadow: '0 0 16px 4px rgba(26,255,92,0.4)' } : {}}
              >
                {s.icon}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-40"
                  />
                )}
              </div>
              {/* Label */}
              <span
                className={`text-[11px] font-medium text-center max-w-[60px] leading-tight transition-colors duration-300 ${
                  isActive || isPast ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
