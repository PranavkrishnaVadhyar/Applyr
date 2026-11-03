import Link from 'next/link'

export function Brand({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return <Link href={href} aria-label="Applyr home" className="inline-flex items-center gap-2.5 text-foreground shrink-0">
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 text-primary"><path fill="currentColor" d="M3 27 14 5h4l11 22h-6l-3-7h-8l2.5-5H18l-2-4-8 16Z" /></svg>
    {!compact && <span className="font-display text-2xl font-semibold tracking-tight">Applyr<span className="text-primary">.</span></span>}
  </Link>
}
