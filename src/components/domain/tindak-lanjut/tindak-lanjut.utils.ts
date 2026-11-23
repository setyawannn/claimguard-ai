import { toast } from 'sonner'
import { formatDateId, formatIdr } from '#/lib/format'
import { escapeHtml, printHtmlDocument } from '#/lib/print-html'
import { CLUSTER_STAGE_META, FRAUD_TYPOLOGY_META } from '#/lib/status-tokens'
import type { BadgeToneMeta, FraudTypology } from '#/lib/status-tokens'
import type {
  ClusterFollowupFilterInput,
  ClusterFollowupItem,
  ClusterFollowupSummary,
} from '#/schemas/clusters.schema'

export const FINAL_STATUS_META: Record<
  ClusterFollowupItem['finalStatus'],
  BadgeToneMeta
> = {
  belum_final: {
    label: 'Belum Final',
    badgeClass:
      'bg-[var(--color-bg-muted)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
    dotClass: 'bg-[var(--color-text-secondary)]',
  },
  tagih_tgr: {
    label: 'Tagih TGR',
    badgeClass:
      'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high-border)] text-[var(--color-risk-high-text)]',
    dotClass: 'bg-[var(--color-risk-high)]',
  },
  kirim_pak_rudi: {
    label: 'Kirim Pak Rudi',
    badgeClass:
      'bg-[var(--color-action-primary-bg)] border-[var(--color-action-primary-border)] text-[var(--color-action-primary)]',
    dotClass: 'bg-[var(--color-action-primary)]',
  },
  proses_aph: {
    label: 'Proses APH',
    badgeClass:
      'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high-border)] text-[var(--color-risk-high-text)]',
    dotClass: 'bg-[var(--color-risk-high)]',
  },
  arsip_wajar: {
    label: 'Arsip Wajar',
    badgeClass:
      'bg-[var(--color-risk-low-bg)] border-[var(--color-risk-low-border)] text-[var(--color-risk-low-text)]',
    dotClass: 'bg-[var(--color-risk-low)]',
  },
}

export function getTypologyShortLabel(typology: string): string {
  if (typology in FRAUD_TYPOLOGY_META) {
    return FRAUD_TYPOLOGY_META[typology as FraudTypology]
  }
  return typology
}

export function exportFollowupCsv(
  items: readonly ClusterFollowupItem[],
  tab: ClusterFollowupFilterInput['tab'],
  page: number,
): void {
  if (items.length === 0) {
    toast.info('Tidak ada data tindak lanjut pada tampilan saat ini untuk diekspor.')
    return
  }

  const headers = [
    'Kode Kluster',
    'Kantor Cabang',
    'FKRTL',
    'Tipologi',
    'Jalur Tindak Lanjut',
    'Status Akhir',
    'Potensi IDR',
    'Pemulihan TGR IDR',
    'Catatan Lapangan',
  ]

  const rows = items.map((item) => [
    item.clusterCode,
    `"${item.branchName}"`,
    `"${item.hospitalName}"`,
    `"${getTypologyShortLabel(item.fraudTypology)}"`,
    `"${CLUSTER_STAGE_META[item.followupStage].label}"`,
    `"${FINAL_STATUS_META[item.finalStatus].label}"`,
    String(item.potentialLossIdr),
    String(item.agreedTgrIdr),
    `"${(item.auditResultNote ?? item.initialInstruction).replace(/"/g, '""')}"`,
  ])

  const csv = `\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `rekap-tindak-lanjut-${tab}-hal-${page}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`Rekap ${items.length} kluster tindak lanjut (.CSV) berhasil diunduh.`)
}

export function printBeritaAcaraPkjknHtml(args: {
  summary: ClusterFollowupSummary
  items: readonly ClusterFollowupItem[]
  auditorName: string
  periodLabel: string
}): void {
  if (args.items.length === 0) {
    toast.info('Tidak ada berkas kluster untuk disusun ke Berita Acara PK-JKN.')
    return
  }

  const todayIso = new Date().toISOString().slice(0, 10)
  const docNumber = `BA-PKJKN/DIVRE-JTM/${todayIso.replace(/-/g, '')}`

  const rowsHtml = args.items
    .map(
      (item, idx) => `
      <tr>
        <td class="col-center">${idx + 1}</td>
        <td class="col-mono">${escapeHtml(item.clusterCode)}<br /><span class="sub">${escapeHtml(item.branchName)}</span></td>
        <td>${escapeHtml(item.hospitalName)}</td>
        <td>${escapeHtml(CLUSTER_STAGE_META[item.followupStage].label)} -> ${escapeHtml(FINAL_STATUS_META[item.finalStatus].label)}</td>
        <td class="col-right">${escapeHtml(formatIdr(item.agreedTgrIdr > 0 ? item.agreedTgrIdr : item.potentialLossIdr))}</td>
        <td>${escapeHtml(item.auditResultNote ?? item.initialInstruction)}</td>
      </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Berita Acara PK-JKN - ${escapeHtml(docNumber)}</title>
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
    .col-center { text-align: center; width: 28px; }
    .col-right { text-align: right; white-space: nowrap; }
    .col-mono { font-family: "Courier New", Courier, monospace; font-size: 8.5pt; white-space: nowrap; }
    .sub { font-family: "Times New Roman", Times, serif; font-size: 8.5pt; }
    .summary-note { font-size: 9.5pt; margin: 8px 0 14px; }
    .sig-table { width: 100%; border-collapse: collapse; margin-top: 24px; page-break-inside: avoid; }
    .sig-table td { width: 50%; border: none; text-align: center; vertical-align: top; background: transparent; padding: 0 12px; }
    .sig-space { height: 54px; }
    .sig-name { font-weight: bold; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <p>BERITA ACARA</p>
    <p>HASIL PENGAWASAN &amp; PENINDAKAN ANTI-FRAUD (PK-JKN)</p>
    <p>BPJS KESEHATAN KEDEPUTIAN WILAYAH JAWA TIMUR</p>
  </div>
  <div class="meta">
    <div>Nomor : ${escapeHtml(docNumber)}</div>
    <div>Periode : ${escapeHtml(args.periodLabel)} · Tanggal : ${escapeHtml(formatDateId(todayIso))}</div>
  </div>
  <p>Telah dilaksanakan pemeriksaan lapangan, pencatatan bukti fisik, dan penetapan status akhir kluster anti-fraud wilayah dengan rincian sebagai berikut :</p>
  <table class="data-table">
    <thead>
      <tr>
        <th>NO</th>
        <th>KLUSTER &amp; CABANG</th>
        <th>FKRTL MITRA</th>
        <th>TINDAK LANJUT &amp; STATUS AKHIR</th>
        <th>NILAI TGR / POTENSI</th>
        <th>CATATAN LAPANGAN</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p class="summary-note">
    Rekapitulasi Wilayah: ${args.summary.pendingFieldCount} menunggu hasil lapangan; Total Pemulihan Dana (TGR) ${escapeHtml(formatIdr(args.summary.totalTgrIdr))} dari ${args.summary.tgrHospitalCount} FKRTL; ${args.summary.pksHospitalCount} RS dalam Evaluasi PKS; ${args.summary.archivedCount} ditutup / arsip wajar.
  </p>
  <table class="sig-table">
    <tr>
      <td>
        <div><strong>PIHAK PERTAMA</strong></div>
        <div>TIM AUDIT PK-JKN CABANG</div>
        <div class="sig-space"></div>
        <div>( ........................................ )</div>
      </td>
      <td>
        <div><strong>PIHAK KEDUA</strong></div>
        <div>PENGAWAS ANTI-FRAUD WILAYAH</div>
        <div class="sig-space"></div>
        <div class="sig-name">${escapeHtml(args.auditorName.toUpperCase())}</div>
      </td>
    </tr>
  </table>
</body>
</html>`

  printHtmlDocument(html, 'Gagal menyiapkan pratinjau cetak Berita Acara PK-JKN.')
}
