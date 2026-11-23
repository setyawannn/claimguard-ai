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
import {
  DASHBOARD_HOSPITALS,
  PERIOD_SNAPSHOTS,
  type PeriodKey,
} from './dashboard.data'

interface DashboardFilterSectionProps {
  period: PeriodKey
  hospitalId: string
  search: string
  hasActiveFilter: boolean
  onPeriodChange: (period: PeriodKey) => void
  onHospitalChange: (hospitalId: string) => void
  onSearchChange: (search: string) => void
  onReset: () => void
  onExport: () => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

export function DashboardFilterSection({
  period,
  hospitalId,
  search,
  hasActiveFilter,
  onPeriodChange,
  onHospitalChange,
  onSearchChange,
  onReset,
  onExport,
}: DashboardFilterSectionProps) {
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={onSearchChange}
      onReset={hasActiveFilter ? onReset : undefined}
    >
      <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodKey)}>
        <SelectTrigger aria-label="Filter Periode Klaim" className={PILL_TRIGGER_CLASS}>
          <Calendar className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {(Object.keys(PERIOD_SNAPSHOTS) as PeriodKey[]).map((key) => (
            <SelectItem key={key} value={key}>
              {PERIOD_SNAPSHOTS[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={hospitalId} onValueChange={onHospitalChange}>
        <SelectTrigger aria-label="Filter Rumah Sakit" className={PILL_TRIGGER_CLASS}>
          <Building2 className="size-4 text-[var(--color-text-secondary)]" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Semua RS (12 Faskes)</SelectItem>
          {DASHBOARD_HOSPITALS.map((h) => (
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
        <span>Unduh Rekap Harian</span>
      </Button>
    </FilterBar>
  )
}
