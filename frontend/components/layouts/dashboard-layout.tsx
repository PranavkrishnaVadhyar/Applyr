 'use client'
import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Brand } from '@/components/brand'
import { ThemeSelect } from '@/components/theme-select'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Menu, LogOut, User, BarChart3, FileText, FileCheck, Home, Puzzle } from 'lucide-react'
const menuItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/applications', label: 'Applications', icon: FileCheck },
  { href: '/dashboard/resumes', label: 'Resume library', icon: FileText },
  { href: '/dashboard/analytics', label: 'Activity', icon: BarChart3 },
  { href: '/dashboard/setup', label: 'Extension setup', icon: Puzzle },
  { href: '/dashboard/profile', label: 'Account profile', icon: User },
]
export function DashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const navigation = <div className="flex h-full flex-col">
    <div className="p-6"><Brand href="/dashboard" /></div>
    <nav aria-label="Workspace navigation" className="flex-1 px-3 space-y-1">{menuItems.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}><item.icon size={18} />{item.label}</Link>)}</nav>
    <div className="p-5 border-t space-y-3"><p className="text-xs text-muted-foreground truncate" title={user?.email}>{user?.email}</p><Link href="/data" className="block text-xs text-muted-foreground hover:text-foreground">How your data is used</Link><button onClick={logout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"><LogOut size={16} /> Sign out</button></div>
  </div>
  return <div className="flex min-h-screen bg-background">
    <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-card p-3 rounded">Skip to content</a>
    <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 border-r bg-card">{navigation}</aside>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="p-0 w-72"><SheetTitle className="sr-only">Workspace navigation</SheetTitle><SheetDescription className="sr-only">Choose a page in Applyr.</SheetDescription>{navigation}</SheetContent></Sheet>
    <div className="min-w-0 flex-1 lg:ml-60">
      <header className="h-16 border-b bg-background/95 sticky top-0 z-30 flex items-center justify-between gap-4 px-5 md:px-8"><div className="flex gap-3 items-center"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></Button><span className="text-sm text-muted-foreground">{menuItems.find(item => item.href === pathname)?.label || 'Workspace'}</span></div><ThemeSelect /></header>
      <main id="workspace-content" tabIndex={-1} className="mx-auto max-w-7xl px-5 py-8 md:p-10">{children}</main>
    </div>
  </div>
}
