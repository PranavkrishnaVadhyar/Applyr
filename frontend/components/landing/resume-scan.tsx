'use client'

import { useEffect, useState } from 'react'

const SKILLS = ['React', 'TypeScript', 'Node.js', 'Python', 'FastAPI', 'TailwindCSS']

export function ResumeScanAnimation() {
  const [scanPos, setScanPos]     = useState(0)       // 0–100 (percentage)
  const [revealed, setRevealed]   = useState<number[]>([])
  const [done, setDone]           = useState(false)

  useEffect(() => {
    let frame: ReturnType<typeof requestAnimationFrame>
    let start: number | null = null
    const DURATION = 2400 // ms for one full scan

    const animate = (ts: number) => {
      if (!start) start = ts
      const elapsed = ts - start
      const pct = Math.min((elapsed / DURATION) * 100, 100)
      setScanPos(pct)

      // Reveal skill pills as scan line crosses them
      const slotH = 100 / SKILLS.length
      const triggered = SKILLS.map((_, i) => (i + 0.7) * slotH).reduce<number[]>(
        (acc, y, i) => (pct >= y ? [...acc, i] : acc),
        []
      )
      setRevealed(triggered)

      if (pct < 100) {
        frame = requestAnimationFrame(animate)
      } else {
        setDone(true)
        // Reset after pause
        setTimeout(() => {
          setDone(false); setScanPos(0); setRevealed([]); start = null
          frame = requestAnimationFrame(animate)
        }, 2000)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="relative w-full max-w-xs mx-auto rounded-2xl border border-primary/20 bg-card overflow-hidden"
         style={{ boxShadow: 'var(--shadow-neon)' }}>
      {/* Resume card header */}
      <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary text-xs font-bold">AI</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">John Doe · Resume.pdf</p>
          <p className="text-[10px] text-muted-foreground">Scanning for skills…</p>
        </div>
      </div>

      {/* Scanning area */}
      <div className="relative px-5 py-4 space-y-2 min-h-[220px]">
        {/* Green scanning line */}
        <div
          className="absolute left-0 right-0 h-px bg-primary transition-none pointer-events-none"
          style={{ top: `${scanPos}%`, boxShadow: '0 0 8px 2px rgba(26,255,92,0.5)' }}
        />

        {SKILLS.map((skill, i) => (
          <div
            key={skill}
            className={`flex items-center gap-2 transition-all duration-300 ${
              revealed.includes(i) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
            <span className="text-xs font-mono text-foreground">{skill}</span>
            {revealed.includes(i) && (
              <span className="ml-auto text-[10px] text-primary font-bold">✓</span>
            )}
          </div>
        ))}

        {done && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/70 backdrop-blur-sm">
            <div className="text-center space-y-1 animate-reveal">
              <p className="text-primary text-lg font-bold">✓</p>
              <p className="text-xs font-semibold text-foreground">Skills Detected!</p>
              <p className="text-[10px] text-muted-foreground">{SKILLS.length} skills found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
