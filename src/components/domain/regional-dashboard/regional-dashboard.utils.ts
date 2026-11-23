import { toast } from 'sonner'
import type { RegionalClusterItem } from '#/schemas/clusters.schema'

export const REGIONAL_PERIOD_OPTIONS: ReadonlyArray<{
  value: 'all' | '2026-11' | '2026-09'
  label: string
}> = [
  { value: 'all', label: 'Semua Periode Aktif' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-09', label: 'September 2026' },
]

export function exportRegionalSummaryCsv(
  clusters: readonly RegionalClusterItem[],
  periodLabel: string,
  branchScope: string,
): void {
  if (clusters.length === 0) {
    toast.info('Tidak ada kluster wilayah pada tampilan saat ini untuk diekspor.')
    return
  }

  const headers = [
    'Kode Kluster',
    'Judul Kluster',
    'Kantor Cabang',
    'FKRTL Utama',
    'DPJP',
    'Skor AI',
    'Prioritas',
    'Klaim Tereskalasi',
    'Potensi Kerugian IDR',
    'Tahap Tindak Lanjut',
  ]

  const rows = clusters.map((item) => [
    item.clusterCode,
    `"${item.title.replace(/"/g, '""')}"`,
    `"${item.branchName}"`,
    `"${item.hospitalName}"`,
    `"${item.doctorName ?? '-'}"`,
    String(item.riskScore),
    item.priorityLevel,
    String(item.escalatedClaimCount),
    String(item.potentialLossIdr),
    item.followupStage,
  ])

  const csv = `\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rekap-wilayah-divre-${branchScope.toLowerCase()}-${periodLabel.toLowerCase().replace(/\s+/g, '-')}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`Rekap ${clusters.length} kluster wilayah berhasil diunduh.`)
}
