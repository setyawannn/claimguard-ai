import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '#/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  className?: string
}

export function EmptyState({
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-6 py-12 text-center',
        className,
      )}
    >
      <CheckCircle2
        className="mb-3 size-8 text-[var(--color-risk-low)]"
        aria-hidden="true"
      />
      <p className="text-h3 text-[var(--color-text-primary)]">{title}</p>
      <p className="mt-1 max-w-md text-sm text-[var(--color-text-secondary)]">
        {description}
      </p>
    </div>
  )
}

interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({
  label = 'Menyusun data audit...',
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2.5 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-6 py-10 text-sm font-medium text-[var(--color-text-secondary)]',
        className,
      )}
    >
      <Loader2
        className="size-4 animate-spin text-[var(--color-action-primary)]"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  )
}
