import { toast } from 'sonner'
import { formatDateId, formatIdr } from '#/lib/format'
import { escapeHtml, printHtmlDocument } from '#/lib/print-html'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import type {
  PksDecisionRowItem,
  PksDecisionsSummary,
} from '#/schemas/hospitals.schema'

export interface FinalPolicyOption {
  value:
    | 'PKS Bersyarat 6 Bln'
    | 'Teguran Keras SP-2'
    | 'Perpanjang Penuh'
    | 'Putus Layanan'
  label: string
  tone: 'danger' | 'warning' | 'success' | 'neutral'
  hint: string
}

export const FINAL_POLICY_OPTIONS: readonly FinalPolicyOption[] = [
  {
    value: 'PKS Bersyarat 6 Bln',
    label: 'PKS Bersyarat 6 Bln',
    tone: 'danger',
    hint: 'Masa percobaan 6 bulan dengan syarat pelunasan TGR & audit BOR.',
  },
  {
    value: 'Teguran Keras SP-2',
    label: 'Teguran Keras SP-2',
    tone: 'warning',
    hint: 'Peringatan resmi cabang kedua atas ketidakpatuhan kontrak.',
  },
  {
    value: 'Perpanjang Penuh',
    label: 'Perpanjang Penuh',
    tone: 'success',
    hint: 'Perpanjangan PKS reguler 1 tahun untuk FKRTL berkinerja patuh.',
  },
  {
    value: 'Putus Layanan',
    label: 'Putus Layanan',
    tone: 'danger',
    hint: 'Penghentian kerja sama JKN akibat pelanggaran kontrak berat.',
  },
]

export const RECOMMENDED_POLICY_LABELS: Record<
  PksDecisionRowItem['recommendedPolicy'],
  string
> = {
  pks_bersyarat: 'Evaluasi PKS / Bersyarat',
  teguran_sp1: 'Teguran SP-1',
  pembinaan: 'Pembinaan RS',
  perpanjang: 'Lanjut PKS',
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

export function exportPksAuditTrailCsv(
  items: readonly PksDecisionRowItem[],
): void {
  if (items.length === 0) {
    toast.info('Tidak ada data keputusan PKS untuk diekspor ke CSV.')
    return
  }

  const headers = [
    'Kode FKRTL',
    'Nama Rumah Sakit',
    'Tipe',
    'Skor Kepatuhan',
    'Grade',
    'Komitmen TGR (IDR)',
    'Rekomendasi Cabang',
    'Keputusan Akhir',
    'Status PKS',
    'No. Surat e-Office',
    'Status Log',
    'Catatan Rapat',
  ]

  const rows = items.map((item) => [
    csvCell(item.hospitalCode),
    csvCell(item.hospitalName),
    csvCell(item.facilityType),
    String(item.complianceScore),
    csvCell(item.complianceGrade),
    String(item.tgrCommitmentIdr > 0 ? item.tgrCommitmentIdr : item.tgrBurdenIdr),
    csvCell(RECOMMENDED_POLICY_LABELS[item.recommendedPolicy]),
    csvCell(item.finalPolicy ?? 'Menunggu Rapat Direksi'),
    csvCell(PKS_STATUS_META[item.pksStatus].label),
    csvCell(item.eofficeRefNumber ?? '-'),
    csvCell(item.isLocked ? 'Terkunci Final' : 'Menunggu Rapat'),
    csvCell(item.executiveNote ?? '-'),
  ])

  const csv = `\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-trail-kebijakan-pks-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`Audit Trail ${items.length} keputusan PKS (.CSV) diunduh.`)
}

export function printPksBundleHtml(args: {
  items: readonly PksDecisionRowItem[]
  summary: PksDecisionsSummary
  unitName: string
  executiveName: string
}): void {
  if (args.items.length === 0) {
    toast.info('Tidak ada daftar keputusan PKS untuk dicetak.')
    return
  }

  const todayIso = new Date().toISOString().slice(0, 10)
  const docNumber = `RAPAT-PKS/${args.unitName.replace(/\s+/g, '-').toUpperCase()}/${todayIso.replace(/-/g, '')}`

  const rowsHtml = args.items
    .map((item, idx) => {
      const tgrValue =
        item.tgrCommitmentIdr > 0 ? item.tgrCommitmentIdr : item.tgrBurdenIdr
      const decisionText = item.finalPolicy ?? 'Menunggu Rapat Direksi'
      return `
      <tr>
        <td class="col-center">${idx + 1}</td>
        <td class="col-mono">${escapeHtml(item.hospitalCode)}<br /><span class="sub">PKS s.d. ${escapeHtml(formatDateId(item.pksExpiresAt))}</span></td>
        <td><strong>${escapeHtml(item.hospitalName)}</strong><br /><span class="sub">Tipe ${escapeHtml(item.facilityType)} · Skor ${item.complianceScore} (${escapeHtml(item.complianceGrade)})</span></td>
        <td class="col-right">${escapeHtml(formatIdr(tgrValue))}</td>
        <td>${escapeHtml(RECOMMENDED_POLICY_LABELS[item.recommendedPolicy])}</td>
        <td><strong>${escapeHtml(decisionText)}</strong><br /><span class="sub">${escapeHtml(item.eofficeRefNumber ?? 'Belum ada No. e-Office')}</span></td>
        <td class="col-center">${item.isLocked ? 'Terkunci' : 'Siap Rapat'}</td>
      </tr>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Bundel Rapat Evaluasi Kebijakan PKS - ${escapeHtml(docNumber)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; background: #fff; font-family: "Times New Roman", Times, serif; font-size: 10.5pt; line-height: 1.45; }
    .header { text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 14px; line-height: 1.35; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header p { margin: 0; }
    .meta { margin-bottom: 12px; font-size: 10pt; }
    .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; }
    .data-table th, .data-table td { border: 1px solid #000; padding: 5px 6px; background: transparent; text-align: left; vertical-align: top; }
    .data-table th { text-align: center; font-weight: bold; }
    .col-center { text-align: center; }
    .col-right { text-align: right; white-space: nowrap; }
    .col-mono { font-family: "Courier New", Courier, monospace; font-size: 8.5pt; white-space: nowrap; }
    .sub { font-family: "Times New Roman", Times, serif; font-size: 8.5pt; }
    .summary { font-size: 9.5pt; margin: 10px 0 20px; }
    .sig { width: 250px; margin-left: auto; text-align: center; page-break-inside: avoid; }
    .sig-space { height: 56px; }
    .sig-name { font-weight: bold; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <p>BUNDEL KEPUTUSAN RAPAT EVALUASI KONTRAK PKS TAHUN 2027</p>
    <p>FASILITAS KESEHATAN RUJUKAN TINGKAT LANJUTAN (FKRTL)</p>
    <p>BPJS KESEHATAN ${escapeHtml(args.unitName.toUpperCase())}</p>
  </div>
  <div class="meta">
    <div>Nomor Bundel &nbsp;: ${escapeHtml(docNumber)}</div>
    <div>Tanggal Cetak : ${escapeHtml(formatDateId(todayIso))} · Total FKRTL : ${args.summary.totalCount} RS</div>
    <div>Komitmen TGR Cabang : ${escapeHtml(formatIdr(args.summary.totalTgrCommitmentIdr))} · Final Terkunci : ${args.summary.finalCount} · Menunggu Rapat : ${args.summary.waitingMeetingCount}</div>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>NO</th>
        <th>KODE &amp; MASA PKS</th>
        <th>RUMAH SAKIT &amp; SKOR</th>
        <th>BEBAN TGR</th>
        <th>REKOMENDASI</th>
        <th>KEPUTUSAN &amp; NO. e-OFFICE</th>
        <th>STATUS</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p class="summary">
    Catatan: Dokumen ini disusun sebagai bahan penetapan kontrak kerja sama FKRTL Tahun 2027 berdasarkan skor kepatuhan 4 pilar Permenkes 16/2019 dan hasil audit investigasi wilayah.
  </p>
  <div class="sig">
    <div>Kepala Kantor Cabang ${escapeHtml(args.unitName)}</div>
    <div class="sig-space"></div>
    <div class="sig-name">${escapeHtml(args.executiveName.toUpperCase())}</div>
  </div>
</body>
</html>`

  printHtmlDocument(html, 'Gagal menyiapkan pratinjau cetak Bundel Rapat PKS.')
}
