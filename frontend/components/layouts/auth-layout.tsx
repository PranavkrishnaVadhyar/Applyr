import { ReactNode } from 'react'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { ThemeSelect } from '@/components/theme-select'
export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background flex flex-col"><header className="p-6 flex justify-between items-center"><Brand /><ThemeSelect /></header><main className="flex-1 flex items-center justify-center px-5 py-12"><div className="w-full max-w-md"><p className="text-sm text-primary font-medium mb-3">Less repetition. More possibility.</p><div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-soft">{children}</div><p className="text-sm text-muted-foreground text-center mt-6">You stay in control of every application.</p><Link href="/data" className="block text-center text-sm text-primary underline underline-offset-4 mt-2">How your data is used</Link></div></main></div>
}
