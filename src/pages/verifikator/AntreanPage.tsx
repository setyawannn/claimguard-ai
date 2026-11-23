import { useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { RowSelectionState } from '@tanstack/react-table'
import { Download } from 'lucide-react'
import {
  AntreanConfirmDialogs,
  type AntreanConfirmMode,
} from '#/components/domain/antrean/AntreanConfirmDialogs'
import { AntreanFilterSection } from '#/components/domain/antrean/AntreanFilterSection'
import { AntreanTableSection } from '#/components/domain/antrean/AntreanTableSection'
import { exportAntreanCsv } from '#/components/domain/antrean/antrean.utils'
import { PageHeader } from '#/components/layout/PageHeader'
import { Button } from '#/components/ui/button'
import {
  claimsQueueQueryOptions,
  useApproveFastTrackMutation,
  useBulkClaimActionMutation,
} from '#/queries/claims.queries'
import type { ClaimQueueItem, ClaimsFilterInput } from '#/schemas/claims.schema'

interface AntreanPageProps {
  filters: ClaimsFilterInput
  onFiltersChange: (patch: Partial<ClaimsFilterInput>) => void
  onResetFilters: () => void
}

export function AntreanPage({
  filters,
  onFiltersChange,
  onResetFilters,
}: AntreanPageProps) {
  const router = useRouter()
  const { data } = useSuspenseQuery(claimsQueueQueryOptions(filters))
  const [selectedIds, setSelectedIds] = useState<RowSelectionState>({})
  const [confirmMode, setConfirmMode] = useState<AntreanConfirmMode>(null)

  const bulkMutation = useBulkClaimActionMutation()
  const fastTrackMutation = useApproveFastTrackMutation()

  const { items, pagination, summary, hospitals } = data

  const selectedItems = useMemo(
    () => items.filter((item) => Boolean(selectedIds[item.id])),
    [items, selectedIds],
  )
  const selectedAmountIdr = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.tariffIdr, 0),
    [selectedItems],
  )

  const hasActiveFilters =
    Boolean(filters.hospitalId) ||
    Boolean(filters.status) ||
    Boolean(filters.typology) ||
    Boolean(filters.search) ||
    filters.sort !== 'score_sla'

  const updateFilterAndClearSelection = (patch: Partial<ClaimsFilterInput>) => {
    setSelectedIds({})
    onFiltersChange({ ...patch, page: patch.page ?? 1 })
  }

  const handleInspect = (item: ClaimQueueItem) => {
    void router.navigate({
      to: '/antrean/$claimId',
      params: { claimId: item.id },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Antrean Verifikasi Klaim"
        subtitle={`${summary.perluTelaahCount} berkas membutuhkan pemeriksaan manual · ${summary.readyClarifyCount} balasan klarifikasi RS siap diputuskan hari ini.`}
        actions={
          <>
            <Button
              type="button"
              variant="outlinePill"
              onClick={() =>
                exportAntreanCsv(items, filters.tab, pagination.page)
              }
              className="h-10 px-4 text-[13px] font-medium"
            >
              <Download
                className="size-4 text-[var(--color-text-secondary)]"
                aria-hidden="true"
              />
              <span>Ekspor Antrean</span>
            </Button>
            <Button
              type="button"
              disabled={
                summary.fastTrackCount === 0 || fastTrackMutation.isPending
              }
              onClick={() => setConfirmMode('fast_track')}
              className="h-10 rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--color-action-primary-hover)]"
            >
              Setujui Klaim Wajar ({summary.fastTrackCount})
            </Button>
          </>
        }
      />

      <AntreanFilterSection
        filters={filters}
        hospitals={hospitals}
        hasActiveFilters={hasActiveFilters}
        onFiltersChange={updateFilterAndClearSelection}
        onReset={() => {
          setSelectedIds({})
          onResetFilters()
        }}
      />

      <AntreanTableSection
        items={items}
        pagination={pagination}
        summary={summary}
        activeTab={filters.tab}
        selectedIds={selectedIds}
        selectedCount={selectedItems.length}
        isBulkPending={bulkMutation.isPending}
        onSelectedIdsChange={setSelectedIds}
        onTabChange={(tab) => updateFilterAndClearSelection({ tab })}
        onPageChange={(page) => updateFilterAndClearSelection({ page })}
        onOpenBulkClarify={() => setConfirmMode('bulk_clarify')}
        onOpenBulkApprove={() => setConfirmMode('bulk_approve')}
        onInspect={handleInspect}
      />

      <AntreanConfirmDialogs
        mode={confirmMode}
        onClose={() => setConfirmMode(null)}
        summary={summary}
        selectedItems={selectedItems}
        selectedAmountIdr={selectedAmountIdr}
        isFastTrackPending={fastTrackMutation.isPending}
        isBulkPending={bulkMutation.isPending}
        onConfirmFastTrack={async () => {
          await fastTrackMutation.mutateAsync(undefined)
          setConfirmMode(null)
        }}
        onConfirmBulk={async (action, note) => {
          await bulkMutation.mutateAsync({
            claimIds: selectedItems.map((i) => i.id),
            action,
            note,
          })
          setSelectedIds({})
          setConfirmMode(null)
        }}
      />
    </div>
  )
}
