'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, User, BarChart3, FileText, FileCheck, Home, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/applications', label: 'Applications', icon: FileCheck },
  { href: '/dashboard/resumes', label: 'Resumes', icon: FileText },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const logoSrc = theme === 'dark' ? '/logo-dark.PNG' : '/logo-light.PNG'

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo & Theme Toggle */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={logoSrc} alt="Applyr Logo" className="h-8 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors duration-150 text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary/10 text-primary border-l-[3px] border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4 space-y-2">
            <div className="px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="text-foreground font-medium truncate">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start gap-2"
              onClick={logout}
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border sticky top-0 z-30 px-6 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          {/* Breadcrumb / Page indicator */}
          <div className="hidden md:flex items-center gap-2 mx-auto text-sm text-muted-foreground">
            <span className="text-foreground/40">/</span>
            <span className="text-primary font-semibold capitalize">
              {pathname === '/dashboard' ? 'Overview' : pathname.split('/').pop()?.replace('-', ' ')}
            </span>
          </div>

          <div className="flex-1" />

          {/* Header actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/profile"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 p-2 rounded-lg hover:bg-secondary"
              title="Profile"
            >
              <User size={18} />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
