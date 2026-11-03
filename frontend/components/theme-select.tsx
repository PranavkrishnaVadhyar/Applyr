'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return <label className="flex items-center gap-2 text-xs text-muted-foreground">Theme
    <select aria-label="Color theme" className="rounded-md border border-input bg-background px-2 py-2 text-foreground" value={mounted ? theme : 'system'} onChange={e => setTheme(e.target.value)}>
      <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
    </select>
  </label>
}
