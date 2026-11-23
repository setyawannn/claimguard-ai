import { Building2, Calendar, Filter, ListFilter } from 'lucide-react'
import { FilterBar } from '#/components/shared/FilterBar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { CLAIM_STATUS_META } from '#/lib/status-tokens'
import { cn } from '#/lib/utils'
import type {
  ClaimsHistoryFilterInput,
  HistoryPeriodOption,
  HospitalOption,
} from '#/schemas/claims.schema'

interface RiwayatFilterSectionProps {
  filters: ClaimsHistoryFilterInput
  hospitals: readonly HospitalOption[]
  periods: readonly HistoryPeriodOption[]
  needFinalCount: number
  hasActiveFilters: boolean
  onFiltersChange: (patch: Partial<ClaimsHistoryFilterInput>) => void
  onReset: () => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

const HISTORY_STATUS_KEYS = [
  'klarifikasi',
  'balasan_rs',
  'disetujui',
  'false_positive',
  'pending_rs',
  'ditolak',
] as const

export function RiwayatFilterSection({
  filters,
  hospitals,
  periods,
  needFinalCount,
  hasActiveFilters,
  onFiltersChange,
  onReset,
}: RiwayatFilterSectionProps) {
  const isOnlyNeedFinal = Boolean(filters.onlyNeedFinal)

  return (
    <FilterBar
      searchValue={filters.search ?? ''}
      searchPlaceholder="Cari No. SEP, pasien, atau isi catatan..."
      onSearchChange={(value) =>
        onFiltersChange({ search: value.trim() || undefined })
      }
      onReset={hasActiveFilters ? onReset : undefined}
    >
      <Select
        value={filters.period ?? 'all'}
        onValueChange={(v) =>
          onFiltersChange({ period: v === 'all' ? undefined : v })
        }
      >
        <SelectTrigger aria-label="Filter Periode" className={PILL_TRIGGER_CLASS}>
          <Calendar className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Semua Periode</SelectItem>
          {periods.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
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
        <SelectTrigger aria-label="Filter Rumah Sakit" className={PILL_TRIGGER_CLASS}>
          <Building2 className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">
            Semua RS ({hospitals.length} Faskes)
          </SelectItem>
          {hospitals.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              {h.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status ?? 'all'}
        onValueChange={(v) =>
          onFiltersChange({
            status:
              v === 'all'
                ? undefined
                : (v as ClaimsHistoryFilterInput['status']),
          })
        }
      >
        <SelectTrigger aria-label="Filter Status Akhir" className={PILL_TRIGGER_CLASS}>
          <Filter className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Status Akhir: Semua</SelectItem>
          {HISTORY_STATUS_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {CLAIM_STATUS_META[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        aria-pressed={isOnlyNeedFinal}
        onClick={() =>
          onFiltersChange({
            onlyNeedFinal: isOnlyNeedFinal ? undefined : true,
          })
        }
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors',
          isOnlyNeedFinal
            ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]'
            : 'border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)]/60 text-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-bg)]',
        )}
      >
        <ListFilter className="size-4" aria-hidden="true" />
        <span>Perlu Edit Klarifikasi ({needFinalCount})</span>
      </button>
    </FilterBar>
  )
}
