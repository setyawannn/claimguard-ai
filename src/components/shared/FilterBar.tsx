import { useEffect, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  onReset?: () => void
  children?: ReactNode
  className?: string
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari No. SEP, pasien, atau RS...',
  onReset,
  children,
  className,
}: FilterBarProps) {
  const [draft, setDraft] = useState(searchValue)

  useEffect(() => {
    setDraft(searchValue)
  }, [searchValue])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== searchValue) onSearchChange(draft)
    }, 300)
    return () => clearTimeout(timer)
  }, [draft, searchValue, onSearchChange])

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {children}
        {onReset && (
          <Button type="button" variant="outlinePill" size="sm" onClick={onReset}>
            <X className="size-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      <div className="relative w-full sm:w-80">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-secondary)]"
          aria-hidden="true"
        />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] pl-10 pr-4 text-sm shadow-none"
        />
      </div>
    </div>
  )
}
