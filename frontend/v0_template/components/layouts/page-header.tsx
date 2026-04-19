import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="space-y-2 mb-8 animate-slide-in-up">
      <h1 className="text-4xl font-bold tracking-tight text-foreground font-display">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground text-lg">{description}</p>
      )}
      {children && (
        <div className="pt-4">
          {children}
        </div>
      )}
    </div>
  )
}
