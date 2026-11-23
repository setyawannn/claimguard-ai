import { toast } from 'sonner'
import {
  CLAIM_STATUS_META,
  FRAUD_TYPOLOGY_META,
  type ClaimStatus,
} from '#/lib/status-tokens'
import type {
  ClaimQueueItem,
  ClaimsFilterInput,
} from '#/schemas/claims.schema'

export function getActionLabel(status: ClaimStatus): string {
  if (status === 'balasan_rs') return 'Putuskan'
  if (status === 'klarifikasi' || status === 'pending_rs') return 'Pantau'
  if (
    status === 'disetujui' ||
    status === 'false_positive' ||
    status === 'ditolak'
  ) {
    return 'Detail'
  }
  return 'Periksa'
}

export function getPageNumbers(current: number, total: number): number[] {
  const maxVisible = 5
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, idx) => idx + 1)
  }
  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, current - half)
  const end = Math.min(total, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)
  return Array.from({ length: end - start + 1 }, (_, idx) => start + idx)
}

export function exportAntreanCsv(
  items: readonly ClaimQueueItem[],
  tab: ClaimsFilterInput['tab'],
  page: number,
): void {
  if (items.length === 0) {
    toast.info('Tidak ada berkas pada tampilan saat ini untuk diekspor.')
    return
  }

  const headers = [
    'No SEP',
    'Pasien',
    'INA-CBG',
    'Rumah Sakit',
    'DPJP',
    'Tipologi AI',
    'Skor AI',
    'Tagihan IDR',
    'Status',
  ]
  const rows = items.map((c) => [
    c.noSep,
    `"${c.patientAlias}"`,
    `"${c.inacbgDescription} (${c.inacbgCode})"`,
    `"${c.hospitalName}"`,
    `"${c.doctorName}"`,
    `"${FRAUD_TYPOLOGY_META[c.fraudTypology]}"`,
    String(c.riskScore),
    String(c.tariffIdr),
    CLAIM_STATUS_META[c.status].label,
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `antrean-claimguard-${tab}-hal-${page}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`Rekap ${items.length} berkas antrean berhasil diunduh.`)
}
