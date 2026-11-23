import { Building2, Calendar, Filter } from 'lucide-react'
import { FilterBar } from '#/components/shared/FilterBar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  CLAIM_STATUS_META,
  FRAUD_TYPOLOGY_META,
  type ClaimStatus,
  type FraudTypology,
} from '#/lib/status-tokens'
import type { ClaimsFilterInput, HospitalOption } from '#/schemas/claims.schema'

interface AntreanFilterSectionProps {
  filters: ClaimsFilterInput
  hospitals: readonly HospitalOption[]
  hasActiveFilters: boolean
  onFiltersChange: (patch: Partial<ClaimsFilterInput>) => void
  onReset: () => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

export function AntreanFilterSection({
  filters,
  hospitals,
  hasActiveFilters,
  onFiltersChange,
  onReset,
}: AntreanFilterSectionProps) {
  return (
    <FilterBar
      searchValue={filters.search ?? ''}
      searchPlaceholder="Cari No. SEP, pasien, kode INA-CBG..."
      onSearchChange={(value) =>
        onFiltersChange({ search: value.trim() || undefined })
      }
      onReset={hasActiveFilters ? onReset : undefined}
    >
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
            status: v === 'all' ? undefined : (v as ClaimStatus),
          })
        }
      >
        <SelectTrigger aria-label="Filter Status Klaim" className={PILL_TRIGGER_CLASS}>
          <Filter className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Status: Semua Status</SelectItem>
          {(Object.keys(CLAIM_STATUS_META) as ClaimStatus[]).map((key) => (
            <SelectItem key={key} value={key}>
              {CLAIM_STATUS_META[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.typology ?? 'all'}
        onValueChange={(v) =>
          onFiltersChange({
            typology: v === 'all' ? undefined : (v as FraudTypology),
          })
        }
      >
        <SelectTrigger
          aria-label="Filter Tipologi Fraud"
          className={PILL_TRIGGER_CLASS}
        >
          <Filter className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Semua Tipologi Fraud</SelectItem>
          {(Object.keys(FRAUD_TYPOLOGY_META) as FraudTypology[]).map((key) => (
            <SelectItem key={key} value={key}>
              {FRAUD_TYPOLOGY_META[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sort}
        onValueChange={(v) =>
          onFiltersChange({ sort: v as ClaimsFilterInput['sort'] })
        }
      >
        <SelectTrigger aria-label="Urutkan Antrean" className={PILL_TRIGGER_CLASS}>
          <Calendar className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="score_sla">Urutkan: Skor & SLA Terdekat</SelectItem>
          <SelectItem value="tariff_desc">Urutkan: Tagihan Tertinggi</SelectItem>
          <SelectItem value="newest">Urutkan: Tanggal Masuk Terbaru</SelectItem>
        </SelectContent>
      </Select>
    </FilterBar>
  )
}
