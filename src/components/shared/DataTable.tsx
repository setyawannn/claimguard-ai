import { useState } from 'react'
import {
  createSortedRowModel,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'
import { EmptyState, LoadingState } from './EmptyState'

const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
})

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<typeof features, TData>[]
  data: TData[]
  getRowId?: (row: TData) => string
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (next: RowSelectionState) => void
  onRowClick?: (row: TData) => void
  getRowClassName?: (row: TData) => string | undefined
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  page?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  embedded?: boolean
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  getRowClassName,
  isLoading = false,
  emptyTitle = 'Tidak ada data yang cocok',
  emptyDescription = 'Sesuaikan filter atau kata kunci pencarian Anda.',
  page = 1,
  totalPages = 1,
  totalItems,
  onPageChange,
  embedded = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useTable<
    typeof features,
    TData,
    { sorting: SortingState; rowSelection: RowSelectionState }
  >(
    {
      features,
      columns,
      data,
      getRowId,
      state: {
        sorting,
        ...(rowSelection !== undefined ? { rowSelection } : {}),
      },
      onSortingChange: setSorting,
      ...(onRowSelectionChange
        ? {
            onRowSelectionChange: (updater) => {
              const next =
                typeof updater === 'function'
                  ? updater(rowSelection ?? {})
                  : updater
              onRowSelectionChange(next)
            },
          }
        : {}),
    },
    (state) => ({
      sorting: state.sorting,
      rowSelection: state.rowSelection,
    }),
  )

  if (isLoading) {
    return <LoadingState />
  }

  const rows = table.getRowModel().rows
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div
      className={
        embedded
          ? 'overflow-x-auto'
          : 'overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]'
      }
    >
      <Table>
        <TableHeader className="bg-[var(--color-bg-muted)]">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead
                    key={header.id}
                    className="text-caption-tag uppercase text-[var(--color-text-secondary)]"
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)]"
                      >
                        <table.FlexRender header={header} />
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={cn(
                onRowClick && 'cursor-pointer hover:bg-[var(--color-bg-canvas)]',
                getRowClassName?.(row.original),
              )}
            >
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {onPageChange && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-default)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          <span>
            Halaman {page} dari {totalPages}
            {totalItems !== undefined ? ` · Total ${totalItems} data` : ''}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              ← Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Berikutnya →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
