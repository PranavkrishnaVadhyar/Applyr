'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function ProtectedDashboard({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user && !error) router.replace('/auth/login')
  }, [loading, user, error, router])
  if (loading) return <p className="p-8" role="status">Loading your account…</p>
  if (error && !user) return <div className="p-8 space-y-4" role="alert">
    <p>{error}</p><button onClick={() => window.location.reload()}>Try again</button>
  </div>
  if (!user) return null
  return children
}
