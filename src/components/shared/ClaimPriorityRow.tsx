import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

interface ClaimPriorityRowProps {
  badge: ReactNode
  title: string
  meta: string
  amountText: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function ClaimPriorityRow({
  badge,
  title,
  meta,
  amountText,
  actionLabel = 'Periksa',
  onAction,
  className,
}: ClaimPriorityRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)]/70 px-4 py-3.5 transition-colors hover:bg-[var(--color-bg-surface)]',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="shrink-0">{badge}</div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
            {title}
          </p>
          <p className="mt-0.5 truncate text-[12px] font-normal text-[var(--color-text-secondary)]">
            {meta}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
          {amountText}
        </span>
        <Button
          type="button"
          variant="subtleAction"
          size="sm"
          onClick={onAction}
          className="text-[12px] font-semibold"
        >
          {actionLabel} →
        </Button>
      </div>
    </div>
  )
}
