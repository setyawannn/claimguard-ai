import { toast } from 'sonner'
import { formatDateId, formatIdr, formatPercent } from '#/lib/format'
import { escapeHtml, printHtmlDocument } from '#/lib/print-html'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import type { BadgeToneMeta, RiskZone } from '#/lib/status-tokens'
import type {
  HospitalScorecardItem,
  HospitalsFilterInput,
  HospitalsScorecardSummary,
} from '#/schemas/hospitals.schema'

export function getHospitalBorStatus(item: HospitalScorecardItem): {
  label: string
  zone: RiskZone
} {
  if (item.borTotalPct >= 95 || item.borCardioVipPct >= 105) {
    return { label: `BOR ${formatPercent(item.borTotalPct)} (Overkapasitas)`, zone: 'merah' }
  }
  if (item.borTotalPct >= 83) {
    return { label: `BOR ${formatPercent(item.borTotalPct)} (Perlu Pantau)`, zone: 'kuning' }
  }
  return { label: `BOR ${formatPercent(item.borTotalPct)} (Wajar)`, zone: 'hijau' }
}

export function getGradeToneMeta(
  score: number,
  grade: HospitalScorecardItem['complianceGrade'],
): BadgeToneMeta {
  if (grade === 'A') {
    return {
      label: `Skor ${score} · ${grade}`,
      badgeClass:
        'bg-[var(--color-risk-low-bg)] border-[var(--color-risk-low-border)] text-[var(--color-risk-low-text)]',
      dotClass: 'bg-[var(--color-risk-low)]',
    }
  }
  if (grade === 'B' || grade === 'C') {
    return {
      label: `Skor ${score} · ${grade}`,
      badgeClass:
        'bg-[var(--color-risk-medium-bg)] border-[var(--color-risk-medium-border)] text-[var(--color-risk-medium-text)]',
      dotClass: 'bg-[var(--color-risk-medium)]',
    }
  }
  return {
    label: `Skor ${score} · ${grade}`,
    badgeClass:
      'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high-border)] text-[var(--color-risk-high-text)]',
    dotClass: 'bg-[var(--color-risk-high)]',
  }
}

export function exportMatriksRsCsv(
  items: readonly HospitalScorecardItem[],
  tab: HospitalsFilterInput['tab'],
): void {
  if (items.length === 0) {
    toast.info('Tidak ada data FKRTL mitra pada tampilan saat ini untuk diekspor.')
    return
  }

  const headers = [
    'Kode FKRTL',
    'Nama Rumah Sakit',
    'Tipe',
    'Direktur',
    'Kapasitas TT',
    'BOR Total (%)',
    'Fast-Track (%)',
    'Skor Kepatuhan',
    'Grade',
    'Beban TGR (IDR)',
    'Status PKS',
    'Berakhir PKS',
  ]

  const rows = items.map((h) => [
    h.code,
    `"${h.name}"`,
    h.facilityType,
    `"${h.directorName}"`,
    String(h.bedCapacity),
    String(h.borTotalPct),
    String(h.pilarFastTrackPct),
    String(h.complianceScore),
    h.complianceGrade,
    String(h.tgrBurdenIdr),
    `"${PKS_STATUS_META[h.pksStatus].label}"`,
    h.pksExpiresAt,
  ])

  const csv = `\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `matriks-rapor-fkrtl-${tab}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`Matriks ${items.length} FKRTL mitra (.CSV) berhasil diunduh.`)
}

export function printBundelRapatPksHtml(args: {
  items: readonly HospitalScorecardItem[]
  summary: HospitalsScorecardSummary
  unitName: string
  executiveName: string
}): void {
  if (args.items.length === 0) {
    toast.info('Tidak ada FKRTL untuk disusun ke Bundel Rapat PKS.')
    return
  }

  const todayIso = new Date().toISOString().slice(0, 10)
  const docNumber = `BUNDEL-PKS/${args.unitName.replace(/\s+/g, '-').toUpperCase()}/${todayIso.replace(/-/g, '')}`

  const rowsHtml = args.items
    .map(
      (h, idx) => `
      <tr>
        <td class="col-center">${idx + 1}</td>
        <td class="col-mono">${escapeHtml(h.code)}<br /><span class="sub">${escapeHtml(formatDateId(h.pksExpiresAt))}</span></td>
        <td><strong>${escapeHtml(h.name)}</strong><br /><span class="sub">Tipe ${escapeHtml(h.facilityType)} · ${escapeHtml(h.directorName)}</span></td>
        <td class="col-center">${escapeHtml(formatPercent(h.borTotalPct))}</td>
        <td class="col-center">${h.complianceScore} (${escapeHtml(h.complianceGrade)})</td>
        <td class="col-right">${escapeHtml(formatIdr(h.tgrBurdenIdr))}</td>
        <td>${escapeHtml(PKS_STATUS_META[h.pksStatus].label)}</td>
      </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Bundel Rapat Evaluasi PKS - ${escapeHtml(docNumber)}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; background: #fff; font-family: "Times New Roman", Times, serif; font-size: 10.5pt; line-height: 1.45; }
    .header { text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; line-height: 1.35; }
    .header p { margin: 0; }
    .meta { margin-bottom: 12px; font-size: 10pt; }
    .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; }
    .data-table th, .data-table td { border: 1px solid #000; padding: 5px 6px; background: transparent; text-align: left; vertical-align: top; }
    .data-table th { text-align: center; font-weight: bold; }
    .col-center { text-align: center; }
    .col-right { text-align: right; white-space: nowrap; }
    .col-mono { font-family: "Courier New", Courier, monospace; font-size: 8.5pt; white-space: nowrap; }
    .sub { font-family: "Times New Roman", Times, serif; font-size: 8.5pt; }
    .summary { font-size: 9.5pt; margin: 8px 0 18px; }
    .sig { width: 240px; margin-left: auto; text-align: center; page-break-inside: avoid; }
    .sig-space { height: 54px; }
    .sig-name { font-weight: bold; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <p>BUNDEL RAPAT EVALUASI KEPATUHAN &amp; KONTRAK PKS</p>
    <p>FASILITAS KESEHATAN RUJUKAN TINGKAT LANJUTAN (FKRTL)</p>
    <p>BPJS KESEHATAN ${escapeHtml(args.unitName.toUpperCase())}</p>
  </div>
  <div class="meta">
    <div>Nomor Dokumen : ${escapeHtml(docNumber)}</div>
    <div>Tanggal Cetak : ${escapeHtml(formatDateId(todayIso))} · Rata-rata Skor Cabang : ${args.summary.avgComplianceScore} / 100 (${escapeHtml(args.summary.avgGradeLabel)})</div>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>NO</th>
        <th>KODE &amp; PKS</th>
        <th>RUMAH SAKIT &amp; DIREKSI</th>
        <th>BOR</th>
        <th>SKOR</th>
        <th>BEBAN TGR</th>
        <th>STATUS PKS</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p class="summary">
    Ringkasan Cabang: ${args.summary.totalCount} FKRTL mitra; ${args.summary.evaluasiPksCount} perlu evaluasi/pembinaan; ${args.summary.mitraPatuhCount} mitra patuh Grade A.
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
