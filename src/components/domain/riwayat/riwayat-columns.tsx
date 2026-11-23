import type { ComponentProps } from 'react'
import { ArrowRight } from 'lucide-react'
import type { DataTable } from '#/components/shared/DataTable'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatIdrCompact } from '#/lib/format'
import type { ClaimHistoryItem } from '#/schemas/claims.schema'
import {
  formatTimestampWib,
  getSourceTransitionMeta,
  getTargetTransitionMeta,
} from './riwayat.utils'

type HistoryColumns = ComponentProps<typeof DataTable<ClaimHistoryItem>>['columns']

interface BuildRiwayatColumnsArgs {
  selectedId: string | null
  onSelect: (item: ClaimHistoryItem) => void
}

export function buildRiwayatColumns({
  selectedId,
  onSelect,
}: BuildRiwayatColumnsArgs): HistoryColumns {
  return [
    {
      accessorKey: 'noSep',
      header: 'NO. SEP & WAKTU',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-mono-code text-[12px] font-semibold text-[var(--color-text-primary)]">
            {row.original.noSep}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {formatTimestampWib(row.original.eventTimestampIso)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'patientAlias',
      header: 'PASIEN & RS',
      cell: ({ row }) => (
        <div className="max-w-[200px] space-y-0.5 whitespace-normal">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            {row.original.patientAlias} · {row.original.inacbgDescription}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {row.original.hospitalName} · {formatIdrCompact(row.original.tariffIdr)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'TRANSISI STATUS',
      cell: ({ row }) => {
        const sourceMeta = getSourceTransitionMeta(row.original.fromStatusLabel)
        const targetMeta = getTargetTransitionMeta(row.original)
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge meta={sourceMeta} />
            <span
              className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
              aria-hidden="true"
            >
              →
            </span>
            <StatusBadge meta={targetMeta} />
          </div>
        )
      },
    },
    {
      accessorKey: 'decisionNote',
      header: 'CATATAN KEPUTUSAN',
      cell: ({ row }) => {
        const text =
          row.original.decisionNote ??
          row.original.hospitalResponseNote ??
          row.original.initialClarificationNote ??
          'Menunggu konfirmasi bukti & status akhir dari rumah sakit.'

        return (
          <p className="line-clamp-2 max-w-[240px] whitespace-normal text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
            {text}
          </p>
        )
      },
    },
    {
      id: 'actions',
      header: 'AKSI',
      cell: ({ row }) => {
        const isSelected = row.original.id === selectedId
        const isNeedFinal = row.original.isNeedFinal
        return (
          <Button
            type="button"
            variant={isNeedFinal || isSelected ? 'subtleAction' : 'outlinePill'}
            size="sm"
            className="h-8 rounded-full px-3 text-[12px]"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(row.original)
            }}
          >
            <span>{isNeedFinal ? 'Edit Akhir' : 'Ubah'}</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        )
      },
    },
  ]
}
