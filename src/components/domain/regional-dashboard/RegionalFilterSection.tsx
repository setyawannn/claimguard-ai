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
  BranchEscalationSummary,
  RegionalDashboardFilterInput,
} from '#/schemas/clusters.schema'
import { REGIONAL_PERIOD_OPTIONS } from './regional-dashboard.utils'

interface RegionalFilterSectionProps {
  filters: RegionalDashboardFilterInput
  branches: readonly BranchEscalationSummary[]
  hasActiveFilter: boolean
  onFiltersChange: (patch: Partial<RegionalDashboardFilterInput>) => void
  onReset: () => void
  onExport: () => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

export function RegionalFilterSection({
  filters,
  branches,
  hasActiveFilter,
  onFiltersChange,
  onReset,
  onExport,
}: RegionalFilterSectionProps) {
  return (
    <FilterBar
      searchValue={filters.search ?? ''}
      searchPlaceholder="Cari nama RS, dokter DPJP, atau kluster..."
      onSearchChange={(value) =>
        onFiltersChange({ search: value.trim() || undefined })
      }
      onReset={hasActiveFilter ? onReset : undefined}
    >
      <Select
        value={filters.period}
        onValueChange={(v) =>
          onFiltersChange({
            period: v as RegionalDashboardFilterInput['period'],
          })
        }
      >
        <SelectTrigger
          aria-label="Filter Periode Pengawasan"
          className={PILL_TRIGGER_CLASS}
        >
          <Calendar className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {REGIONAL_PERIOD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.branchCode ?? 'all'}
        onValueChange={(v) =>
          onFiltersChange({ branchCode: v === 'all' ? undefined : v })
        }
      >
        <SelectTrigger
          aria-label="Filter Kantor Cabang"
          className={PILL_TRIGGER_CLASS}
        >
          <Building2 className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">
            Semua KC Jatim ({branches.length} Cabang)
          </SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.branchCode} value={branch.branchCode}>
              {branch.branchName} ({branch.hospitalCountLabel})
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
        <span>Unduh Rekap Wilayah</span>
      </Button>
    </FilterBar>
  )
}
