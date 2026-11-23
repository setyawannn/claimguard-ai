import { cn } from '#/lib/utils'
import type { BadgeToneMeta } from '#/lib/status-tokens'

interface StatusBadgeProps {
  meta: BadgeToneMeta
  className?: string
}

export function StatusBadge({ meta, className }: StatusBadgeProps) {
  return (
    <span className={cn('badge-pill', meta.badgeClass, className)}>
      <span
        className={cn('size-1.5 shrink-0 rounded-full', meta.dotClass)}
        aria-hidden="true"
      />
      <span>{meta.label}</span>
    </span>
  )
}
