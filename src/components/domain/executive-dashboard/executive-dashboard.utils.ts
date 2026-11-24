import { toast } from 'sonner'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import type { PksStatus } from '#/lib/status-tokens'
import type { ExecutiveHospitalScoreItem } from '#/schemas/hospitals.schema'

export const EXECUTIVE_PERIOD_OPTIONS: ReadonlyArray<{
  value: 'all' | '2026-11' | '2026-10'
  label: string
}> = [
  { value: 'all', label: 'Semua Periode Aktif' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-10', label: 'Oktober 2026' },
]

export function getPksStatusLabel(status: string): string {
  if (status in PKS_STATUS_META) {
    return PKS_STATUS_META[status as PksStatus].label
  }
  return status
}

export function exportExecutiveCsv(
  hospitals: readonly ExecutiveHospitalScoreItem[],
  periodLabel: string,
  unitName: string,
): void {
  if (hospitals.length === 0) {
    toast.info('Tidak ada data FKRTL mitra untuk diekspor.')
    return
  }

  const headers = [
    'Kode FKRTL',
    'Nama Rumah Sakit',
    'Tipe',
    'Skor Kepatuhan',
    'Grade',
    'BOR Total (%)',
    'Fast-Track (%)',
    'Beban TGR (IDR)',
    'Status PKS',
    'Masa Berlaku PKS',
    'Tipologi Dominan',
  ]

  const rows = hospitals.map((h) => [
    h.code,
    `"${h.name}"`,
    h.facilityType,
    String(h.complianceScore),
    h.complianceGrade,
    String(h.borTotalPct),
    String(h.pilarFastTrackPct),
    String(h.tgrBurdenIdr),
    `"${getPksStatusLabel(h.pksStatus)}"`,
    h.pksExpiresAt,
    `"${h.dominantTypology.replace(/"/g, '""')}"`,
  ])

  const csv = `\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `laporan-eksekutif-${unitName.toLowerCase().replace(/\s+/g, '-')}-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`Laporan eksekutif ${hospitals.length} FKRTL (.CSV) berhasil diunduh.`)
}
