import type { ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import { cn } from '#/lib/utils'

interface FaskesAnomalyRowProps {
  hospitalName: string
  meta: string
  badge: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

export function FaskesAnomalyRow({
  hospitalName,
  meta,
  badge,
  active = false,
  onClick,
  className,
}: FaskesAnomalyRowProps) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-[14px] border px-4 py-3.5 text-left transition-colors',
        active
          ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)]/50'
          : 'border-[var(--color-border-default)] bg-[var(--color-bg-canvas)]/70 hover:bg-[var(--color-bg-surface)]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)]">
          <Building2 className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
            {hospitalName}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-normal text-[var(--color-text-secondary)]">
            {meta}
          </p>
        </div>
      </div>

      <div className="shrink-0">{badge}</div>
    </Tag>
  )
}
