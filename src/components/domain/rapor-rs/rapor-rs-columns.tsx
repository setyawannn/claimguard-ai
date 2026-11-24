import type { ComponentProps } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import { ArrowRight } from 'lucide-react'
import type { DataTable } from '#/components/shared/DataTable'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { formatDateId, formatIdr, formatPercent } from '#/lib/format'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import type { HospitalScorecardItem } from '#/schemas/hospitals.schema'
import { getGradeToneMeta, getHospitalBorStatus } from './rapor-rs.utils'

type HospitalColumns = ComponentProps<
  typeof DataTable<HospitalScorecardItem>
>['columns']

interface BuildRaporRsColumnsArgs {
  selectedIds: RowSelectionState
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  onToggleAll: (checked: boolean) => void
  onToggleRow: (id: string, checked: boolean) => void
  onInspect: (item: HospitalScorecardItem) => void
}

export function buildRaporRsColumns({
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleAll,
  onToggleRow,
  onInspect,
}: BuildRaporRsColumnsArgs): HospitalColumns {
  return [
    {
      id: 'select',
      header: () => (
        <Checkbox
          aria-label="Pilih semua FKRTL pada halaman ini"
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
            aria-label={`Pilih ${row.original.name}`}
            checked={Boolean(selectedIds[row.original.id])}
            onCheckedChange={(v) => onToggleRow(row.original.id, v === true)}
          />
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'KODE & MASA PKS',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="font-mono-code text-[12px] font-semibold text-[var(--color-text-primary)]">
            {row.original.code} · {formatDateId(row.original.pksExpiresAt)}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {PKS_STATUS_META[row.original.pksStatus].label}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'RUMAH SAKIT & TIPE',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            {row.original.name}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            Tipe {row.original.facilityType} · {row.original.bedCapacity} TT ·{' '}
            {row.original.directorName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'borTotalPct',
      header: 'KEWAJARAN BOR',
      cell: ({ row }) => {
        const bor = getHospitalBorStatus(row.original)
        return (
          <div className="space-y-0.5">
            <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">
              {bor.label}
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              VIP/Khusus {formatPercent(row.original.borCardioVipPct)} kasur
            </p>
          </div>
        )
      },
    },
    {
      accessorKey: 'pilarFastTrackPct',
      header: 'FAST-TRACK & MODUS',
      cell: ({ row }) => (
        <div className="max-w-[200px] space-y-0.5 whitespace-normal">
          <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">
            {formatPercent(row.original.pilarFastTrackPct)} Fast-Track
          </p>
          <p className="line-clamp-1 text-[11px] text-[var(--color-text-secondary)]">
            {row.original.dominantTypology}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'complianceScore',
      header: 'BEBAN TGR & SKOR',
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-mono-code text-[12px] font-semibold text-[var(--color-text-primary)]">
            {row.original.tgrBurdenIdr > 0
              ? `TGR ${formatIdr(row.original.tgrBurdenIdr)}`
              : 'Rp 0 Temuan'}
          </p>
          <StatusBadge
            meta={getGradeToneMeta(
              row.original.complianceScore,
              row.original.complianceGrade,
            )}
          />
        </div>
      ),
    },
    {
      accessorKey: 'pksStatus',
      header: 'KEPUTUSAN PKS',
      cell: ({ row }) => (
        <StatusBadge meta={PKS_STATUS_META[row.original.pksStatus]} />
      ),
    },
    {
      id: 'actions',
      header: 'AKSI',
      cell: ({ row }) => (
        <Button
          type="button"
          variant={
            row.original.complianceGrade === 'A' ? 'outlinePill' : 'subtleAction'
          }
          size="sm"
          className="h-8 rounded-full px-3 text-[12px]"
          onClick={(e) => {
            e.stopPropagation()
            onInspect(row.original)
          }}
        >
          <span>
            {row.original.complianceGrade === 'A' ? 'Detail' : 'Buka Rapor'}
          </span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Button>
      ),
    },
  ]
}
