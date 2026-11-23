import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

interface ExternalProcessBoxProps {
  title: string
  children: ReactNode
  className?: string
}

export function ExternalProcessBox({
  title,
  children,
  className,
}: ExternalProcessBoxProps) {
  return (
    <div
      className={cn(
        'external-boundary rounded-[var(--radius-node)] p-4',
        className,
      )}
    >
      <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
        {title}
      </p>
      <div className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
        {children}
      </div>
    </div>
  )
}
