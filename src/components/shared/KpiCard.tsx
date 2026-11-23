import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  inlineSubtitle?: string
  subtitle?: string
  valueSize?: '24' | '26'
  badge?: ReactNode
  leadingIcon?: ReactNode
  footer?: ReactNode
  focal?: boolean
  className?: string
}

export function KpiCard({
  title,
  value,
  inlineSubtitle,
  subtitle,
  valueSize = '26',
  badge,
  leadingIcon,
  footer,
  focal = false,
  className,
}: KpiCardProps) {
  if (focal) {
    return (
      <div
        className={cn(
          'focal-card flex flex-col justify-between rounded-[var(--radius-card-lg)] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          {leadingIcon ?? (
            <p className="text-[14px] font-semibold text-white/95">{title}</p>
          )}
          {badge}
        </div>

        <div className="mt-4">
          <p className="text-[20px] font-bold leading-snug tracking-tight text-white tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-[12px] font-normal leading-relaxed text-white/90">
              {subtitle}
            </p>
          )}
        </div>

        {footer && <div className="mt-4">{footer}</div>}
      </div>
    )
  }

  return (
    <div className={cn('card-surface flex flex-col justify-between p-6', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">
          {title}
        </p>
        {badge}
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <p
            className={cn(
              'font-bold leading-tight tracking-tight text-[var(--color-text-primary)] tabular-nums',
              valueSize === '24' ? 'text-[24px]' : 'text-[26px]',
            )}
          >
            {value}
          </p>
          {inlineSubtitle && (
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
              {inlineSubtitle}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-[11px] font-normal text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
