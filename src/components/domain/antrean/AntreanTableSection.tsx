import type { RowSelectionState } from '@tanstack/react-table'
import { DataTable } from '#/components/shared/DataTable'
import { Button } from '#/components/ui/button'
import { formatIdrCompact } from '#/lib/format'
import { cn } from '#/lib/utils'
import type {
  ClaimQueueItem,
  ClaimsFilterInput,
  ClaimsQueueResponse,
  ClaimsQueueSummary,
} from '#/schemas/claims.schema'
import { buildAntreanColumns } from './antrean-columns'
import { getPageNumbers } from './antrean.utils'

const TAB_ITEMS: ReadonlyArray<{
  key: ClaimsFilterInput['tab']
  label: string
}> = [
  { key: 'perlu_telaah', label: 'Perlu Telaah' },
  { key: 'belum_dicek', label: 'Belum Dicek' },
  { key: 'klarifikasi', label: 'Klarifikasi & Balasan' },
  { key: 'selesai', label: 'Selesai Diputuskan' },
]

interface AntreanTableSectionProps {
  items: ClaimQueueItem[]
  pagination: ClaimsQueueResponse['pagination']
  summary: ClaimsQueueSummary
  activeTab: ClaimsFilterInput['tab']
  selectedIds: RowSelectionState
  selectedCount: number
  isBulkPending: boolean
  onSelectedIdsChange: (next: RowSelectionState) => void
  onTabChange: (tab: ClaimsFilterInput['tab']) => void
  onPageChange: (page: number) => void
  onOpenBulkClarify: () => void
  onOpenBulkApprove: () => void
  onInspect: (item: ClaimQueueItem) => void
}

export function AntreanTableSection({
  items,
  pagination,
  summary,
  activeTab,
  selectedIds,
  selectedCount,
  isBulkPending,
  onSelectedIdsChange,
  onTabChange,
  onPageChange,
  onOpenBulkClarify,
  onOpenBulkApprove,
  onInspect,
}: AntreanTableSectionProps) {
  const allVisibleSelected =
    items.length > 0 && items.every((item) => Boolean(selectedIds[item.id]))
  const someVisibleSelected =
    !allVisibleSelected && items.some((item) => Boolean(selectedIds[item.id]))

  const columns = buildAntreanColumns({
    selectedIds,
    allVisibleSelected,
    someVisibleSelected,
    onToggleAll: (checked) => {
      const next: RowSelectionState = {}
      if (checked) {
        for (const item of items) next[item.id] = true
      }
      onSelectedIdsChange(next)
    },
    onToggleRow: (id, checked) => {
      const next = { ...selectedIds }
      if (checked) next[id] = true
      else delete next[id]
      onSelectedIdsChange(next)
    },
    onInspect,
  })

  const tabCounts: Record<ClaimsFilterInput['tab'], number> = {
    perlu_telaah: summary.perluTelaahCount,
    belum_dicek: summary.belumDicekCount,
    klarifikasi: summary.klarifikasiCount,
    selesai: summary.selesaiCount,
  }

  const startItem =
    pagination.totalItems === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.totalItems,
  )

  return (
    <section className="card-surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-default)] px-5 py-3.5">
        <div
          role="tablist"
          aria-label="Filter Tab Antrean"
          className="flex flex-wrap items-center gap-1.5"
        >
          {TAB_ITEMS.map((tabItem) => {
            const active = activeTab === tabItem.key
            return (
              <button
                key={tabItem.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(tabItem.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] transition-colors',
                  active
                    ? 'bg-[var(--color-action-primary)] font-semibold text-white'
                    : 'border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
              >
                <span>{tabItem.label}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-mono-code text-[10px] leading-none',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]',
                  )}
                >
                  {tabCounts[tabItem.key]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            {selectedCount} berkas dipilih
          </span>
          <Button
            type="button"
            variant="outlinePill"
            size="sm"
            disabled={selectedCount === 0 || isBulkPending}
            onClick={onOpenBulkClarify}
            className="h-8 px-3 text-[12px]"
          >
            Minta Klarifikasi
          </Button>
          <Button
            type="button"
            variant="subtleAction"
            size="sm"
            disabled={selectedCount === 0 || isBulkPending}
            onClick={onOpenBulkApprove}
            className="h-8 rounded-full px-3 text-[12px]"
          >
            Setujui Terpilih
          </Button>
        </div>
      </div>

      <DataTable
        embedded
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        rowSelection={selectedIds}
        onRowSelectionChange={onSelectedIdsChange}
        onRowClick={onInspect}
        emptyTitle="Tidak ada berkas pada antrean ini"
        emptyDescription="Coba pilih tab lain atau reset filter pencarian."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-default)] px-5 py-3.5 text-[12px] text-[var(--color-text-secondary)]">
        <span>
          Menampilkan {startItem}–{endItem} dari {pagination.totalItems}{' '}
          berkas · Nilai klaim tampilan:{' '}
          <strong className="font-semibold text-[var(--color-text-primary)]">
            {formatIdrCompact(pagination.filteredTariffIdr)}
          </strong>
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outlinePill"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            className="h-8 px-3 text-[12px]"
          >
            Sebelumnya
          </Button>

          {getPageNumbers(pagination.page, pagination.totalPages).map(
            (pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 font-mono-code text-[12px] transition-colors',
                  pageNum === pagination.page
                    ? 'bg-[var(--color-action-primary)] font-semibold text-white'
                    : 'border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]',
                )}
              >
                {pageNum}
              </button>
            ),
          )}

          <Button
            type="button"
            variant="outlinePill"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            className="h-8 px-3 text-[12px]"
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </section>
  )
}
