import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

export type MetricTone = 'high' | 'medium' | 'primary' | 'low'

const TONE_CLASSES: Record<
  MetricTone,
  { bar: string; dot: string; value: string }
> = {
  high: {
    bar: 'bg-[var(--color-risk-high)]',
    dot: 'bg-[var(--color-risk-high)]',
    value: 'text-[var(--color-risk-high)]',
  },
  medium: {
    bar: 'bg-[var(--color-risk-medium)]',
    dot: 'bg-[var(--color-risk-medium)]',
    value: 'text-[var(--color-risk-medium)]',
  },
  primary: {
    bar: 'bg-[var(--color-action-primary)]',
    dot: 'bg-[var(--color-action-primary)]',
    value: 'text-[var(--color-action-primary)]',
  },
  low: {
    bar: 'bg-[var(--color-risk-low)]',
    dot: 'bg-[var(--color-risk-low)]',
    value: 'text-[var(--color-risk-low)]',
  },
}

interface ProgressMetricBarProps {
  label: string
  valueText: string
  percent: number
  tone: MetricTone
  dot?: boolean
  leadingIcon?: ReactNode
}

export function ProgressMetricBar({
  label,
  valueText,
  percent,
  tone,
  dot = false,
  leadingIcon,
}: ProgressMetricBarProps) {
  const styles = TONE_CLASSES[tone]
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div className="flex items-center gap-3">
      {leadingIcon}
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 truncate text-[var(--color-text-secondary)]">
            {dot && (
              <span
                className={cn('size-2 shrink-0 rounded-full', styles.dot)}
                aria-hidden="true"
              />
            )}
            <span className="truncate font-medium text-[var(--color-text-primary)]">
              {label}
            </span>
          </span>
          <span className={cn('shrink-0 font-semibold tabular-nums', styles.value)}>
            {valueText}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
          <div
            className={cn('h-full rounded-full transition-all', styles.bar)}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  )
}
