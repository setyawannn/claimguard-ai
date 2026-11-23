import { useEffect, useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { REGIONAL_PERIOD_OPTIONS } from '#/components/domain/regional-dashboard/regional-dashboard.utils'
import { TindakLanjutFilterSection } from '#/components/domain/tindak-lanjut/TindakLanjutFilterSection'
import { TindakLanjutKpiSection } from '#/components/domain/tindak-lanjut/TindakLanjutKpiSection'
import { TindakLanjutPanel } from '#/components/domain/tindak-lanjut/TindakLanjutPanel'
import { TindakLanjutTableSection } from '#/components/domain/tindak-lanjut/TindakLanjutTableSection'
import {
  exportFollowupCsv,
  printBeritaAcaraPkjknHtml,
} from '#/components/domain/tindak-lanjut/tindak-lanjut.utils'
import { PageHeader } from '#/components/layout/PageHeader'
import { Button } from '#/components/ui/button'
import {
  clusterFollowupQueryOptions,
  useFinalizeClusterMutation,
} from '#/queries/clusters.queries'
import { sessionQueryOptions } from '#/queries/session.queries'
import type { ClusterFollowupFilterInput } from '#/schemas/clusters.schema'

interface TindakLanjutPageProps {
  filters: ClusterFollowupFilterInput
  onFiltersChange: (patch: Partial<ClusterFollowupFilterInput>) => void
  onResetFilters: () => void
}

export function TindakLanjutPage({
  filters,
  onFiltersChange,
  onResetFilters,
}: TindakLanjutPageProps) {
  const { data } = useSuspenseQuery(clusterFollowupQueryOptions(filters))
  const { data: sessionUser } = useSuspenseQuery(sessionQueryOptions())
  const [selectedId, setSelectedId] = useState<string | null>(
    filters.clusterId ?? null,
  )
  const finalizeMutation = useFinalizeClusterMutation()

  const { items, pagination, summary, branches } = data

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null)
      return
    }
    if (filters.clusterId && items.some((i) => i.id === filters.clusterId)) {
      setSelectedId(filters.clusterId)
      return
    }
    const stillVisible = items.some((item) => item.id === selectedId)
    if (!stillVisible) {
      const preferred = items.find((item) => item.isPendingField) ?? items[0]
      setSelectedId(preferred.id)
    }
  }, [items, selectedId, filters.clusterId])

  const selectedCluster = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const periodLabel =
    REGIONAL_PERIOD_OPTIONS.find((p) => p.value === filters.period)?.label ??
    'Semua Periode Aktif'

  const hasActiveFilters =
    filters.period !== 'all' ||
    Boolean(filters.branchCode) ||
    Boolean(filters.stage) ||
    Boolean(filters.onlyPendingField) ||
    Boolean(filters.search)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tindak Lanjut & Rekap"
        subtitle="/tindak-lanjut"
        actions={
          <>
            <Button
              type="button"
              variant="outlinePill"
              onClick={() =>
                exportFollowupCsv(items, filters.tab, pagination.page)
              }
              className="h-10 px-4 text-[13px] font-medium"
            >
              <Download
                className="size-4 text-[var(--color-text-secondary)]"
                aria-hidden="true"
              />
              <span>Ekspor Rekap (.CSV)</span>
            </Button>
            <Button
              type="button"
              disabled={items.length === 0}
              onClick={() =>
                printBeritaAcaraPkjknHtml({
                  summary,
                  items,
                  auditorName: sessionUser?.name ?? 'Pengawas Wilayah',
                  periodLabel,
                })
              }
              className="h-10 rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--color-action-primary-hover)]"
            >
              <FileText className="size-4" aria-hidden="true" />
              <span>Unduh Berita Acara PK-JKN</span>
            </Button>
          </>
        }
      />

      <TindakLanjutKpiSection summary={summary} />

      <TindakLanjutFilterSection
        filters={filters}
        branches={branches}
        pendingFieldCount={summary.pendingFieldCount}
        hasActiveFilters={hasActiveFilters}
        onFiltersChange={(patch) =>
          onFiltersChange({ ...patch, page: patch.page ?? 1 })
        }
        onReset={onResetFilters}
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <TindakLanjutTableSection
          items={items}
          pagination={pagination}
          summary={summary}
          activeTab={filters.tab}
          selectedId={selectedCluster?.id ?? null}
          onTabChange={(tab) => onFiltersChange({ tab, page: 1 })}
          onPageChange={(page) => onFiltersChange({ page })}
          onSelect={(item) => setSelectedId(item.id)}
        />

        <TindakLanjutPanel
          cluster={selectedCluster}
          isSubmitting={finalizeMutation.isPending}
          onFinalize={async (input) => {
            await finalizeMutation.mutateAsync(input)
          }}
        />
      </div>
    </div>
  )
}
