 'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
export default function PracticePage() {
  const [done, setDone] = useState(false)
  return <main className="max-w-2xl mx-auto px-6 py-10 space-y-8"><Brand /><div><p className="text-primary text-sm mb-2">Practice only · no employer receives this form</p><h1 className="text-3xl font-display font-semibold">Try your application assistant.</h1><p className="text-muted-foreground mt-3">Open the Applyr extension, select a resume, and choose Find answers. Review the suggestions before filling.</p></div>
    <form onSubmit={e => { e.preventDefault(); setDone(true) }} className="rounded-xl border bg-card p-6 space-y-5">
      {[['name','Full name','text'],['email','Email','email'],['location','Location','text']].map(([name,label,type]) => <label key={name} className="block text-sm font-medium">{label}<Input name={name} type={type} className="mt-2" /></label>)}
      <label className="block text-sm font-medium">Describe a project you built<textarea name="project" rows={5} className="mt-2 w-full rounded-md border border-input bg-background p-3" /></label>
      <Button type="submit">Finish practice</Button>{done && <p role="status" className="text-primary">Practice complete. Nothing was sent to an employer.</p>}
    </form><Link href="/dashboard/setup" className="inline-block text-sm text-primary underline">Back to setup</Link></main>
}
