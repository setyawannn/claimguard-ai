import type { ComponentProps } from 'react'
import { ArrowRight } from 'lucide-react'
import type { DataTable } from '#/components/shared/DataTable'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatDateId, formatIdrCompact } from '#/lib/format'
import { CLUSTER_STAGE_META } from '#/lib/status-tokens'
import type { ClusterFollowupItem } from '#/schemas/clusters.schema'
import {
  FINAL_STATUS_META,
  getTypologyShortLabel,
} from './tindak-lanjut.utils'

type FollowupColumns = ComponentProps<
  typeof DataTable<ClusterFollowupItem>
>['columns']

interface BuildTindakLanjutColumnsArgs {
  selectedId: string | null
  onSelect: (item: ClusterFollowupItem) => void
}

export function buildTindakLanjutColumns({
  selectedId,
  onSelect,
}: BuildTindakLanjutColumnsArgs): FollowupColumns {
  return [
    {
      accessorKey: 'clusterCode',
      header: 'KLUSTER & TGL',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-mono-code text-[12px] font-semibold text-[var(--color-text-primary)]">
            {row.original.clusterCode} · {row.original.branchName}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {formatDateId(row.original.eventDateIso)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'hospitalName',
      header: 'FASKES & TEMUAN',
      cell: ({ row }) => (
        <div className="max-w-[190px] space-y-0.5 whitespace-normal">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            {row.original.hospitalName}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {getTypologyShortLabel(row.original.fraudTypology)} ·{' '}
            {formatIdrCompact(row.original.potentialLossIdr)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'finalStatus',
      header: 'TINDAK LANJUT → AKHIR',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge meta={CLUSTER_STAGE_META[row.original.followupStage]} />
          <span
            className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
            aria-hidden="true"
          >
            →
          </span>
          <StatusBadge meta={FINAL_STATUS_META[row.original.finalStatus]} />
        </div>
      ),
    },
    {
      accessorKey: 'auditResultNote',
      header: 'CATATAN LAPANGAN',
      cell: ({ row }) => (
        <p className="line-clamp-2 max-w-[220px] whitespace-normal text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          {row.original.auditResultNote ?? row.original.initialInstruction}
        </p>
      ),
    },
    {
      id: 'actions',
      header: 'AKSI',
      cell: ({ row }) => {
        const isSelected = row.original.id === selectedId
        const isPending = row.original.isPendingField
        return (
          <Button
            type="button"
            variant={isPending || isSelected ? 'subtleAction' : 'outlinePill'}
            size="sm"
            className="h-8 rounded-full px-3 text-[12px]"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(row.original)
            }}
          >
            <span>{isPending ? 'Catat Hasil' : 'Ubah'}</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        )
      },
    },
  ]
}
