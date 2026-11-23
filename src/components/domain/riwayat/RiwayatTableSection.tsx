import { getPageNumbers } from '#/components/domain/antrean/antrean.utils'
import { DataTable } from '#/components/shared/DataTable'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type {
  ClaimHistoryItem,
  ClaimsHistoryFilterInput,
  ClaimsHistoryResponse,
  ClaimsHistorySummary,
} from '#/schemas/claims.schema'
import { buildRiwayatColumns } from './riwayat-columns'

const TAB_ITEMS: ReadonlyArray<{
  key: ClaimsHistoryFilterInput['tab']
  label: string
}> = [
  { key: 'semua', label: 'Semua Riwayat' },
  { key: 'perlu_final', label: 'Perlu Status Akhir' },
  { key: 'sudah_final', label: 'Sudah Final' },
]

interface RiwayatTableSectionProps {
  items: ClaimHistoryItem[]
  pagination: ClaimsHistoryResponse['pagination']
  summary: ClaimsHistorySummary
  activeTab: ClaimsHistoryFilterInput['tab']
  selectedId: string | null
  onTabChange: (tab: ClaimsHistoryFilterInput['tab']) => void
  onPageChange: (page: number) => void
  onSelect: (item: ClaimHistoryItem) => void
}

export function RiwayatTableSection({
  items,
  pagination,
  summary,
  activeTab,
  selectedId,
  onTabChange,
  onPageChange,
  onSelect,
}: RiwayatTableSectionProps) {
  const columns = buildRiwayatColumns({ selectedId, onSelect })

  const tabCounts: Record<ClaimsHistoryFilterInput['tab'], number> = {
    semua: summary.totalCount,
    perlu_final: summary.needFinalCount,
    sudah_final: summary.finalizedCount,
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
      <div className="border-b border-[var(--color-border-default)] px-5 py-3.5">
        <div
          role="tablist"
          aria-label="Filter Tab Riwayat Verifikasi"
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
      </div>

      <DataTable
        embedded
        columns={columns}
        data={items}
        getRowId={(row) => row.id}
        onRowClick={onSelect}
        getRowClassName={(row) =>
          row.id === selectedId
            ? 'bg-[var(--color-action-primary-bg)]/55 hover:bg-[var(--color-action-primary-bg)]/70'
            : undefined
        }
        emptyTitle="Belum ada riwayat verifikasi yang cocok"
        emptyDescription="Sesuaikan filter periode, rumah sakit, status akhir, atau kata kunci pencarian."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-default)] px-5 py-3.5 text-[12px] text-[var(--color-text-secondary)]">
        <span>
          Menampilkan {startItem}–{endItem} dari {pagination.totalItems} riwayat
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
