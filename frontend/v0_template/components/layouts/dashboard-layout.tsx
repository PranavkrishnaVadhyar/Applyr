'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, Settings, User, BarChart3, FileText, Zap, FileCheck, Home } from 'lucide-react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/applications', label: 'Applications', icon: FileCheck },
  { href: '/dashboard/extract-job', label: 'Extract Job', icon: Zap },
  { href: '/dashboard/resumes', label: 'Resumes', icon: FileText },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/billing', label: 'Billing', icon: BarChart3 },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-dark transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } animate-slide-in-left`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-border/50 transition-all duration-300">
            <Link href="/dashboard" className="text-2xl font-bold text-primary font-display tracking-wider hover-glow">
              APPLYR
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 hover-lift group relative overflow-hidden ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/50 shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {/* Animated background for active state */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  <Icon size={18} className="flex-shrink-0 relative z-10" />
                  <span className="text-sm font-medium relative z-10">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4 space-y-2">
            <div className="px-4 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="text-foreground font-medium truncate">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 button-outline-neon"
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
        <header className="h-16 border-b border-border/50 glass-dark sticky top-0 z-30 px-6 flex items-center justify-between backdrop-blur-md transition-all duration-300">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-300 hover-lift"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          {/* Breadcrumb / Page indicator */}
          <div className="hidden md:flex items-center gap-2 mx-auto text-sm text-muted-foreground">
            <span className="text-foreground/50">/</span>
            <span className="text-foreground capitalize font-medium">
              {pathname === '/dashboard' ? 'Overview' : pathname.split('/').pop()?.replace('-', ' ')}
            </span>
          </div>

          <div className="flex-1" />

          {/* Header actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-300 hover-lift p-2 rounded-lg hover:bg-secondary/50"
              title="Settings"
            >
              <Settings size={20} />
            </Link>
            <Link
              href="/dashboard/profile"
              className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-300 hover-lift p-2 rounded-lg hover:bg-secondary/50"
              title="Profile"
            >
              <User size={20} />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto page-enter">
          <div className="transition-smooth">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
