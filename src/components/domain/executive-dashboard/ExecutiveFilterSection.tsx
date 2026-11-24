import { Building2, Calendar, Download } from 'lucide-react'
import { FilterBar } from '#/components/shared/FilterBar'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import type {
  ExecutiveDashboardFilterInput,
  ExecutiveHospitalScoreItem,
} from '#/schemas/hospitals.schema'
import { EXECUTIVE_PERIOD_OPTIONS } from './executive-dashboard.utils'

interface ExecutiveFilterSectionProps {
  filters: ExecutiveDashboardFilterInput
  hospitals: readonly ExecutiveHospitalScoreItem[]
  unitName: string
  hasActiveFilter: boolean
  onFiltersChange: (patch: Partial<ExecutiveDashboardFilterInput>) => void
  onReset: () => void
  onExport: () => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

export function ExecutiveFilterSection({
  filters,
  hospitals,
  unitName,
  hasActiveFilter,
  onFiltersChange,
  onReset,
  onExport,
}: ExecutiveFilterSectionProps) {
  return (
    <FilterBar
      searchValue={filters.search ?? ''}
      searchPlaceholder="Cari RS mitra atau status PKS..."
      onSearchChange={(value) =>
        onFiltersChange({ search: value.trim() || undefined })
      }
      onReset={hasActiveFilter ? onReset : undefined}
    >
      <Select
        value={filters.period}
        onValueChange={(v) =>
          onFiltersChange({
            period: v as ExecutiveDashboardFilterInput['period'],
          })
        }
      >
        <SelectTrigger aria-label="Filter Periode Eksekutif" className={PILL_TRIGGER_CLASS}>
          <Calendar className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {EXECUTIVE_PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.hospitalId ?? 'all'}
        onValueChange={(v) =>
          onFiltersChange({ hospitalId: v === 'all' ? undefined : v })
        }
      >
        <SelectTrigger aria-label="Filter FKRTL Mitra" className={PILL_TRIGGER_CLASS}>
          <Building2 className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">
            {hospitals.length} FKRTL Mitra ({unitName})
          </SelectItem>
          {hospitals.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              {h.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outlinePill"
        size="sm"
        onClick={onExport}
        className="h-10 px-4 text-[13px] font-medium"
      >
        <Download className="size-4 text-[var(--color-text-secondary)]" />
        <span>Unduh Laporan Eksekutif</span>
      </Button>
    </FilterBar>
  )
}
