import type { ComponentProps } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import { ArrowRight } from 'lucide-react'
import type { DataTable } from '#/components/shared/DataTable'
import { RiskScoreBadge } from '#/components/shared/RiskScoreBadge'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import {
  formatDateId,
  formatIdr,
  formatSlaRemaining,
} from '#/lib/format'
import { CLAIM_STATUS_META, FRAUD_TYPOLOGY_META } from '#/lib/status-tokens'
import type { ClaimQueueItem } from '#/schemas/claims.schema'
import { getActionLabel } from './antrean.utils'

type QueueColumns = ComponentProps<typeof DataTable<ClaimQueueItem>>['columns']

interface BuildAntreanColumnsArgs {
  selectedIds: RowSelectionState
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  onToggleAll: (checked: boolean) => void
  onToggleRow: (id: string, checked: boolean) => void
  onInspect: (item: ClaimQueueItem) => void
}

export function buildAntreanColumns({
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleAll,
  onToggleRow,
  onInspect,
}: BuildAntreanColumnsArgs): QueueColumns {
  return [
    {
      id: 'select',
      header: () => (
        <Checkbox
          aria-label="Pilih semua berkas pada halaman ini"
          checked={
            allVisibleSelected
              ? true
              : someVisibleSelected
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(v) => onToggleAll(v === true)}
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            aria-label={`Pilih berkas ${row.original.noSep}`}
            checked={Boolean(selectedIds[row.original.id])}
            onCheckedChange={(v) => onToggleRow(row.original.id, v === true)}
          />
        </div>
      ),
    },
    {
      accessorKey: 'noSep',
      header: 'NO. SEP & SLA',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-mono-code text-[12px] font-semibold text-[var(--color-text-primary)]">
            {row.original.noSep}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {formatDateId(row.original.admissionDate)} ·{' '}
            {formatSlaRemaining(row.original.slaDueAt)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'patientAlias',
      header: 'PASIEN & TINDAKAN INA-CBG',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            {row.original.patientAlias} ({row.original.patientGender},{' '}
            {row.original.patientAge} th)
          </p>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            {row.original.inacbgDescription} · {row.original.inacbgCode}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'hospitalName',
      header: 'RUMAH SAKIT & DPJP',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            {row.original.hospitalName}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {row.original.doctorName} · Tipe {row.original.facilityType}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'fraudTypology',
      header: 'SINYAL ANOMALI AI',
      cell: ({ row }) => (
        <div className="max-w-[240px] space-y-0.5 whitespace-normal">
          <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">
            {FRAUD_TYPOLOGY_META[row.original.fraudTypology]}
          </p>
          <p className="line-clamp-1 text-[11px] text-[var(--color-text-secondary)]">
            {row.original.signalSummary}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'riskScore',
      header: 'TAGIHAN & SKOR AI',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-mono-code text-[12px] font-semibold text-[var(--color-text-primary)]">
            {formatIdr(row.original.tariffIdr)}
          </p>
          <RiskScoreBadge score={row.original.riskScore} />
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS KLAIM',
      cell: ({ row }) => (
        <StatusBadge meta={CLAIM_STATUS_META[row.original.status]} />
      ),
    },
    {
      id: 'actions',
      header: 'AKSI',
      cell: ({ row }) => (
        <Button
          type="button"
          variant="subtleAction"
          size="sm"
          className="h-8 rounded-full px-3 text-[12px]"
          onClick={(e) => {
            e.stopPropagation()
            onInspect(row.original)
          }}
        >
          <span>{getActionLabel(row.original.status)}</span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Button>
      ),
    },
  ]
}
