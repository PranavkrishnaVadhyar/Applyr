'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const breadcrumbConfig: Record<string, string> = {
  'dashboard': 'Overview',
  'applications': 'Applications',
  'extract-job': 'Extract Job',
  'resumes': 'Resumes',
  'profile': 'Profile',
  'billing': 'Billing',
  'analytics': 'Analytics',
  'settings': 'Settings',
}

export function Breadcrumb() {
  const pathname = usePathname()

  // Don't show breadcrumb on dashboard root
  if (pathname === '/dashboard') return null

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, idx, arr) => {
      const isLast = idx === arr.length - 1
      const href = '/' + arr.slice(0, idx + 1).join('/')
      const label = breadcrumbConfig[segment] || segment.replace('-', ' ')

      return { href, label, isLast }
    })

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground animate-slide-in-left">
      <Link href="/dashboard" className="hover:text-foreground transition-colors hover-lift">
        Dashboard
      </Link>
      {segments.map((segment) => (
        <div key={segment.href} className="flex items-center gap-2">
          <ChevronRight size={16} className="text-primary/50" />
          {segment.isLast ? (
            <span className="text-foreground font-medium capitalize">{segment.label}</span>
          ) : (
            <Link href={segment.href} className="hover:text-foreground transition-colors hover-lift capitalize">
              {segment.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
