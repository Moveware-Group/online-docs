import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PageShellProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

export function PageShell({
  children,
  className,
  maxWidth = 'xl',
  padding = true,
}: PageShellProps) {
  const maxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div
        className={cn(
          'mx-auto w-full',
          maxWidths[maxWidth],
          padding && 'px-4 py-6 sm:px-6 lg:px-8',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {title}
          </h1>
          {description && (
            <p className="text-neutral-600">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export interface PageContentProps {
  children: ReactNode
  className?: string
}

export function PageContent({ children, className }: PageContentProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>
}
