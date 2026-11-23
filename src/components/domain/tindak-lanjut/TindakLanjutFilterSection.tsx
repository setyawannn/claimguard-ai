import { Building2, Calendar, Filter, ListFilter } from 'lucide-react'
import { REGIONAL_PERIOD_OPTIONS } from '#/components/domain/regional-dashboard/regional-dashboard.utils'
import { FilterBar } from '#/components/shared/FilterBar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { CLUSTER_STAGE_META } from '#/lib/status-tokens'
import type { ClusterStage } from '#/lib/status-tokens'
import { cn } from '#/lib/utils'
import type {
  ClusterFollowupFilterInput,
  InvestigationBranchOption,
} from '#/schemas/clusters.schema'

interface TindakLanjutFilterSectionProps {
  filters: ClusterFollowupFilterInput
  branches: readonly InvestigationBranchOption[]
  pendingFieldCount: number
  hasActiveFilters: boolean
  onFiltersChange: (patch: Partial<ClusterFollowupFilterInput>) => void
  onReset: () => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

const STAGE_KEYS = Object.keys(CLUSTER_STAGE_META) as ClusterStage[]

export function TindakLanjutFilterSection({
  filters,
  branches,
  pendingFieldCount,
  hasActiveFilters,
  onFiltersChange,
  onReset,
}: TindakLanjutFilterSectionProps) {
  const isOnlyPending = Boolean(filters.onlyPendingField)

  return (
    <FilterBar
      searchValue={filters.search ?? ''}
      searchPlaceholder="Cari kode kluster, nama RS, atau catatan..."
      onSearchChange={(value) =>
        onFiltersChange({ search: value.trim() || undefined })
      }
      onReset={hasActiveFilters ? onReset : undefined}
    >
      <Select
        value={filters.period}
        onValueChange={(v) =>
          onFiltersChange({
            period: v as ClusterFollowupFilterInput['period'],
          })
        }
      >
        <SelectTrigger aria-label="Filter Periode" className={PILL_TRIGGER_CLASS}>
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
          {branches.map((b) => (
            <SelectItem key={b.branchCode} value={b.branchCode}>
              {b.branchName} ({b.clusterCount} Kluster)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.stage ?? 'all'}
        onValueChange={(v) =>
          onFiltersChange({
            stage:
              v === 'all'
                ? undefined
                : (v as ClusterFollowupFilterInput['stage']),
          })
        }
      >
        <SelectTrigger
          aria-label="Filter Jalur Tindak Lanjut"
          className={PILL_TRIGGER_CLASS}
        >
          <Filter className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Jalur: Semua Tindak Lanjut</SelectItem>
          {STAGE_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {CLUSTER_STAGE_META[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        aria-pressed={isOnlyPending}
        onClick={() =>
          onFiltersChange({
            onlyPendingField: isOnlyPending ? undefined : true,
          })
        }
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors',
          isOnlyPending
            ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]'
            : 'border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)]/60 text-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-bg)]',
        )}
      >
        <ListFilter className="size-4" aria-hidden="true" />
        <span>Perlu Hasil Lapangan ({pendingFieldCount})</span>
      </button>
    </FilterBar>
  )
}
