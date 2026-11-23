import { useEffect, useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { RiwayatFilterSection } from '#/components/domain/riwayat/RiwayatFilterSection'
import { RiwayatFinalizationPanel } from '#/components/domain/riwayat/RiwayatFinalizationPanel'
import { RiwayatKpiSection } from '#/components/domain/riwayat/RiwayatKpiSection'
import { RiwayatTableSection } from '#/components/domain/riwayat/RiwayatTableSection'
import {
  exportRiwayatCsv,
  printBeritaAcaraHtml,
} from '#/components/domain/riwayat/riwayat.utils'
import { PageHeader } from '#/components/layout/PageHeader'
import { Button } from '#/components/ui/button'
import { useSubmitClaimDecisionMutation } from '#/queries/claim-detail.queries'
import { claimsHistoryQueryOptions } from '#/queries/claims-history.queries'
import { sessionQueryOptions } from '#/queries/session.queries'
import type { ClaimsHistoryFilterInput } from '#/schemas/claims.schema'

interface RiwayatPageProps {
  filters: ClaimsHistoryFilterInput
  onFiltersChange: (patch: Partial<ClaimsHistoryFilterInput>) => void
  onResetFilters: () => void
}

export function RiwayatPage({
  filters,
  onFiltersChange,
  onResetFilters,
}: RiwayatPageProps) {
  const { data } = useSuspenseQuery(claimsHistoryQueryOptions(filters))
  const { data: sessionUser } = useSuspenseQuery(sessionQueryOptions())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { items, pagination, summary, hospitals, periods } = data

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null)
      return
    }
    const stillVisible = items.some((item) => item.id === selectedId)
    if (!stillVisible) {
      const preferred = items.find((item) => item.isNeedFinal) ?? items[0]
      setSelectedId(preferred.id)
    }
  }, [items, selectedId])

  const selectedClaim = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const submitDecision = useSubmitClaimDecisionMutation(selectedClaim?.id ?? '')

  const hasActiveFilters =
    Boolean(filters.period) ||
    Boolean(filters.hospitalId) ||
    Boolean(filters.status) ||
    Boolean(filters.onlyNeedFinal) ||
    Boolean(filters.search)

  const periodLabel = filters.period
    ? (periods.find((p) => p.value === filters.period)?.label ?? filters.period)
    : 'Semua Periode Audit'

  const handleDownloadBahv = () => {
    printBeritaAcaraHtml({
      summary,
      items,
      unitName: sessionUser?.unitName ?? 'KC Malang',
      verifierName: sessionUser?.name ?? 'Verifikator Cabang',
      periodLabel,
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Riwayat Verifikasi Klaim"
        subtitle={`Riwayat · ${summary.totalCount} berkas telah diproses di ${sessionUser?.unitName ?? 'KC Malang'}`}
        actions={
          <>
            <Button
              type="button"
              variant="outlinePill"
              onClick={() =>
                exportRiwayatCsv(items, filters.tab, pagination.page)
              }
              className="h-10 px-4 text-[13px] font-medium"
            >
              <Download
                className="size-4 text-[var(--color-text-secondary)]"
                aria-hidden="true"
              />
              <span>Ekspor Log (.CSV)</span>
            </Button>
            <Button
              type="button"
              disabled={items.length === 0}
              onClick={handleDownloadBahv}
              className="h-10 rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--color-action-primary-hover)]"
            >
              <FileText className="size-4" aria-hidden="true" />
              <span>Unduh Berita Acara</span>
            </Button>
          </>
        }
      />

      <RiwayatKpiSection summary={summary} />

      <RiwayatFilterSection
        filters={filters}
        hospitals={hospitals}
        periods={periods}
        needFinalCount={summary.needFinalCount}
        hasActiveFilters={hasActiveFilters}
        onFiltersChange={(patch) =>
          onFiltersChange({ ...patch, page: patch.page ?? 1 })
        }
        onReset={onResetFilters}
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <RiwayatTableSection
          items={items}
          pagination={pagination}
          summary={summary}
          activeTab={filters.tab}
          selectedId={selectedClaim?.id ?? null}
          onTabChange={(tab) => onFiltersChange({ tab, page: 1 })}
          onPageChange={(page) => onFiltersChange({ page })}
          onSelect={(item) => setSelectedId(item.id)}
        />

        <RiwayatFinalizationPanel
          claim={selectedClaim}
          isSubmitting={submitDecision.isPending}
          onSubmitDecision={async (input) => {
            await submitDecision.mutateAsync(input)
          }}
        />
      </div>
    </div>
  )
}
