import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

interface SectionCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={cn('card-surface p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold leading-snug text-[var(--color-text-primary)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[12px] font-normal text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}
