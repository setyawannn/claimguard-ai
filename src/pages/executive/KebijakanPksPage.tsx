import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  Building2,
  Calendar,
  Download,
  FileText,
  Filter,
  ListFilter,
} from 'lucide-react'
import { KebijakanDecisionPanel } from '#/components/domain/kebijakan/KebijakanDecisionPanel'
import { KebijakanKpiRow } from '#/components/domain/kebijakan/KebijakanKpiRow'
import { KebijakanTableSection } from '#/components/domain/kebijakan/KebijakanTableSection'
import {
  exportPksAuditTrailCsv,
  printPksBundleHtml,
  RECOMMENDED_POLICY_LABELS,
} from '#/components/domain/kebijakan/kebijakan.utils'
import { PageHeader } from '#/components/layout/PageHeader'
import { FilterBar } from '#/components/shared/FilterBar'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import {
  pksDecisionsQueryOptions,
  useLockPksDecisionMutation,
} from '#/queries/hospitals.queries'
import { sessionQueryOptions } from '#/queries/session.queries'
import type { PksDecisionsFilterInput } from '#/schemas/hospitals.schema'

interface KebijakanPksPageProps {
  filters: PksDecisionsFilterInput
  onFiltersChange: (patch: Partial<PksDecisionsFilterInput>) => void
  onResetFilters: () => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

export function KebijakanPksPage({
  filters,
  onFiltersChange,
  onResetFilters,
}: KebijakanPksPageProps) {
  const { data } = useSuspenseQuery(pksDecisionsQueryOptions(filters))
  const { data: sessionUser } = useSuspenseQuery(sessionQueryOptions())
  const lockMutation = useLockPksDecisionMutation()

  const { items, summary } = data

  const selectedItem = useMemo(() => {
    if (filters.selectedId) {
      const matched = items.find(
        (item) =>
          item.decisionId === filters.selectedId ||
          item.hospitalId === filters.selectedId,
      )
      if (matched) return matched
    }
    return items.at(0) ?? null
  }, [items, filters.selectedId])

  const hasActiveFilters =
    filters.tab !== 'semua' ||
    filters.policyPath !== 'all' ||
    filters.onlyWaiting ||
    Boolean(filters.search)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Kebijakan & Evaluasi Kontrak PKS"
        subtitle="/kebijakan · Penetapan hasil rapat direksi & penguncian keputusan PKS 2027"
        actions={
          <>
            <Button
              type="button"
              variant="outlinePill"
              onClick={() => exportPksAuditTrailCsv(items)}
            >
              <Download className="size-4" aria-hidden="true" />
              <span>Ekspor Audit Trail (.CSV)</span>
            </Button>
            <Button
              type="button"
              onClick={() =>
                printPksBundleHtml({
                  items,
                  summary,
                  unitName: sessionUser?.unitName ?? 'KC Malang',
                  executiveName: sessionUser?.name ?? 'Pak Rudi',
                })
              }
              className="rounded-full"
            >
              <FileText className="size-4" aria-hidden="true" />
              <span>Unduh Bundel Rapat PKS (.PDF)</span>
            </Button>
          </>
        }
      />

      <KebijakanKpiRow summary={summary} />

      <FilterBar
        searchValue={filters.search ?? ''}
        searchPlaceholder="Cari nama RS, no. e-Office, atau status PKS..."
        onSearchChange={(value) =>
          onFiltersChange({ search: value.trim() || undefined })
        }
        onReset={hasActiveFilters ? onResetFilters : undefined}
      >
        <div className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)]">
          <Calendar
            className="size-4 text-[var(--color-text-secondary)]"
            aria-hidden="true"
          />
          <span>Tahun Kontrak 2027</span>
        </div>

        <div className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)]">
          <Building2
            className="size-4 text-[var(--color-text-secondary)]"
            aria-hidden="true"
          />
          <span>
            {summary.totalCount} FKRTL {sessionUser?.unitName ?? 'KC Malang'}
          </span>
        </div>

        <Select
          value={filters.policyPath}
          onValueChange={(value) =>
            onFiltersChange({
              policyPath: value as PksDecisionsFilterInput['policyPath'],
            })
          }
        >
          <SelectTrigger
            aria-label="Filter Jalur Kebijakan PKS"
            className={PILL_TRIGGER_CLASS}
          >
            <Filter
              className="size-4 text-[var(--color-text-secondary)]"
              aria-hidden="true"
            />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectItem value="all">Jalur: Semua Kebijakan PKS</SelectItem>
            <SelectItem value="pks_bersyarat">
              {RECOMMENDED_POLICY_LABELS.pks_bersyarat}
            </SelectItem>
            <SelectItem value="teguran_sp1">
              {RECOMMENDED_POLICY_LABELS.teguran_sp1}
            </SelectItem>
            <SelectItem value="pembinaan">
              {RECOMMENDED_POLICY_LABELS.pembinaan}
            </SelectItem>
            <SelectItem value="perpanjang">
              {RECOMMENDED_POLICY_LABELS.perpanjang}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outlinePill"
          onClick={() =>
            onFiltersChange({
              onlyWaiting: !filters.onlyWaiting,
            })
          }
          className={cn(
            'h-10 px-4 text-[13px]',
            filters.onlyWaiting &&
              'border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]',
          )}
        >
          <ListFilter className="size-4" aria-hidden="true" />
          <span>Menunggu Hasil Rapat ({summary.waitingMeetingCount})</span>
        </Button>
      </FilterBar>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_400px]">
        <KebijakanTableSection
          items={items}
          summary={summary}
          activeTab={filters.tab}
          selectedDecisionId={selectedItem?.decisionId ?? null}
          onTabChange={(tab) => onFiltersChange({ tab })}
          onSelect={(decisionId) => onFiltersChange({ selectedId: decisionId })}
        />

        <KebijakanDecisionPanel
          item={selectedItem}
          isPending={lockMutation.isPending}
          onLockDecision={async (input) => {
            await lockMutation.mutateAsync(input)
          }}
        />
      </div>
    </div>
  )
}
