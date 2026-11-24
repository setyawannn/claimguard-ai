import { Building2, Calendar, Filter } from 'lucide-react'
import { FilterBar } from '#/components/shared/FilterBar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import type { PksStatus } from '#/lib/status-tokens'
import type { HospitalsFilterInput } from '#/schemas/hospitals.schema'

interface RaporRsFilterSectionProps {
  filters: HospitalsFilterInput
  totalCount: number
  hasActiveFilters: boolean
  onFiltersChange: (patch: Partial<HospitalsFilterInput>) => void
  onReset: () => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

const PKS_STATUS_KEYS = Object.keys(PKS_STATUS_META) as PksStatus[]

export function RaporRsFilterSection({
  filters,
  totalCount,
  hasActiveFilters,
  onFiltersChange,
  onReset,
}: RaporRsFilterSectionProps) {
  return (
    <FilterBar
      searchValue={filters.search ?? ''}
      searchPlaceholder="Cari RS, kode FKRTL, direktur..."
      onSearchChange={(value) =>
        onFiltersChange({ search: value.trim() || undefined })
      }
      onReset={hasActiveFilters ? onReset : undefined}
    >
      <div className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)]">
        <Building2 className="size-4 text-[var(--color-text-secondary)]" />
        <span>Semua FKRTL ({totalCount} RS)</span>
      </div>

      <Select
        value={filters.pksStatus ?? 'all'}
        onValueChange={(v) =>
          onFiltersChange({
            pksStatus: v === 'all' ? undefined : (v as PksStatus),
          })
        }
      >
        <SelectTrigger aria-label="Filter Status PKS" className={PILL_TRIGGER_CLASS}>
          <Filter className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Status PKS: Semua</SelectItem>
          {PKS_STATUS_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {PKS_STATUS_META[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.facilityType ?? 'all'}
        onValueChange={(v) =>
          onFiltersChange({
            facilityType:
              v === 'all'
                ? undefined
                : (v as HospitalsFilterInput['facilityType']),
          })
        }
      >
        <SelectTrigger aria-label="Filter Tipe RS" className={PILL_TRIGGER_CLASS}>
          <Filter className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Tipe RS: Semua (A / B / C)</SelectItem>
          <SelectItem value="A">Tipe A</SelectItem>
          <SelectItem value="B">Tipe B</SelectItem>
          <SelectItem value="C">Tipe C</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(v) =>
          onFiltersChange({ sort: v as HospitalsFilterInput['sort'] })
        }
      >
        <SelectTrigger aria-label="Urutkan FKRTL" className={PILL_TRIGGER_CLASS}>
          <Calendar className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="score_asc">Urutkan: Skor Terendah dahulu</SelectItem>
          <SelectItem value="score_desc">Urutkan: Skor Tertinggi dahulu</SelectItem>
          <SelectItem value="tgr_desc">Urutkan: Beban TGR Tertinggi</SelectItem>
          <SelectItem value="bor_desc">Urutkan: BOR Tertinggi</SelectItem>
        </SelectContent>
      </Select>
    </FilterBar>
  )
}
