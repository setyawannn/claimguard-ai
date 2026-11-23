import { toast } from 'sonner'
import { formatDateId, formatIdr } from '#/lib/format'
import { escapeHtml, printHtmlDocument } from '#/lib/print-html'
import { CLAIM_STATUS_META } from '#/lib/status-tokens'
import type { BadgeToneMeta, ClaimStatus } from '#/lib/status-tokens'
import type {
  ClaimHistoryItem,
  ClaimsHistoryFilterInput,
  ClaimsHistorySummary,
} from '#/schemas/claims.schema'

const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

const DAYS_FULL_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const

const MONTHS_FULL_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export function formatTimestampWib(isoString: string): string {
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return isoString

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const map = new Map(parts.map((p) => [p.type, p.value]))
  const day = Number(map.get('day') ?? 1)
  const monthIdx = Number(map.get('month') ?? 1) - 1
  const year = map.get('year') ?? '2026'
  const hour = map.get('hour') ?? '00'
  const minute = map.get('minute') ?? '00'

  return `${day} ${MONTHS_ID[monthIdx] ?? 'Jan'} ${year} · ${hour}:${minute} WIB`
}

export function getTargetTransitionMeta(item: ClaimHistoryItem): BadgeToneMeta {
  if (item.isNeedFinal) {
    return {
      label: item.status === 'balasan_rs' ? 'Siap Diputuskan' : 'Belum Final',
      badgeClass:
        'bg-[var(--color-bg-muted)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
      dotClass: 'bg-[var(--color-text-secondary)]',
    }
  }
  return CLAIM_STATUS_META[item.status]
}

export function getSourceTransitionMeta(label: string): BadgeToneMeta {
  if (label === 'Klarifikasi' || label === 'Pending RS') {
    return CLAIM_STATUS_META[label === 'Pending RS' ? 'pending_rs' : 'klarifikasi']
  }
  return {
    label,
    badgeClass:
      'bg-[var(--color-bg-muted)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
    dotClass: 'bg-[var(--color-text-secondary)]',
  }
}

export function exportRiwayatCsv(
  items: readonly ClaimHistoryItem[],
  tab: ClaimsHistoryFilterInput['tab'],
  page: number,
): void {
  if (items.length === 0) {
    toast.info('Tidak ada log riwayat pada tampilan saat ini untuk diekspor.')
    return
  }

  const headers = [
    'No SEP',
    'Waktu Audit',
    'Pasien (UU PDP)',
    'Tindakan INA-CBG',
    'Rumah Sakit',
    'Tagihan IDR',
    'Status Awal',
    'Status Akhir',
    'Catatan Keputusan',
  ]

  const rows = items.map((item) => {
    const targetLabel = getTargetTransitionMeta(item).label
    const noteText =
      item.decisionNote ??
      item.hospitalResponseNote ??
      item.initialClarificationNote ??
      '-'

    return [
      item.noSep,
      `"${formatTimestampWib(item.eventTimestampIso)}"`,
      `"${item.patientAlias}"`,
      `"${item.inacbgDescription} (${item.inacbgCode})"`,
      `"${item.hospitalName}"`,
      String(item.tariffIdr),
      `"${item.fromStatusLabel}"`,
      `"${targetLabel}"`,
      `"${noteText.replace(/"/g, '""')}"`,
    ]
  })

  const csv = `\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `riwayat-verifikasi-${tab}-hal-${page}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`Log ${items.length} berkas riwayat (.CSV) berhasil diunduh.`)
}

const BAHV_STATUS_LABEL: Record<ClaimStatus, string> = {
  belum_dicek: 'Belum Dicek',
  klarifikasi: 'Klarifikasi',
  balasan_rs: 'Balasan RS',
  pending_rs: 'Pending RS',
  disetujui: 'Disetujui',
  false_positive: 'False Positive',
  ditolak: 'Ditolak',
}

interface PrintBahvInput {
  summary: ClaimsHistorySummary
  items: readonly ClaimHistoryItem[]
  unitName: string
  verifierName: string
  periodLabel: string
}

export function buildBeritaAcaraHtml({
  summary,
  items,
  unitName,
  verifierName,
  periodLabel,
}: PrintBahvInput): string {
  const now = new Date()
  const dayName = DAYS_FULL_ID[now.getDay()] ?? 'Senin'
  const dayNum = String(now.getDate()).padStart(2, '0')
  const monthFull = MONTHS_FULL_ID[now.getMonth()] ?? 'Januari'
  const year = now.getFullYear()
  const todayIso = now.toISOString().slice(0, 10)
  const unitSlug = unitName.replace(/\s+/g, '-').toUpperCase()
  const docNumber = `BAHV/${unitSlug}/${todayIso.replace(/-/g, '')}`
  const cityName = unitName.replace(/^KC\s+/i, '').trim() || 'Malang'

  const uniqueHospitals = Array.from(new Set(items.map((i) => i.hospitalName)))
  const hospitalSummary =
    uniqueHospitals.length === 1
      ? uniqueHospitals[0]
      : `${uniqueHospitals.length} FKRTL Mitra ${unitName}`

  const totalTariffIdr = items.reduce((sum, item) => sum + item.tariffIdr, 0)

  const tableRowsHtml = items
    .map((item, idx) => {
      const jenisPelayanan = `${item.inacbgDescription} (${item.inacbgCode})`
      const faskesPasien = `${item.patientAlias} · ${item.hospitalName}`
      const statusText = BAHV_STATUS_LABEL[item.status]
      const biayaText = formatIdr(
        item.status === 'pending_rs' && item.revisedTariffIdr
          ? item.revisedTariffIdr
          : item.tariffIdr,
      )

      return `
        <tr>
          <td class="col-center">${idx + 1}</td>
          <td class="col-mono">${escapeHtml(item.noSep)}<br /><span class="sub">${escapeHtml(formatDateId(item.admissionDate))}</span></td>
          <td>${escapeHtml(faskesPasien)}</td>
          <td>${escapeHtml(jenisPelayanan)}</td>
          <td>${escapeHtml(statusText)}</td>
          <td class="col-right">${escapeHtml(biayaText)}</td>
        </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Berita Acara Verifikasi Klaim - ${escapeHtml(docNumber)}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.45;
    }
    .doc { max-width: 100%; }
    .header {
      text-align: center;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 18px;
      line-height: 1.35;
    }
    .header p { margin: 0; }
    .meta-table {
      width: auto;
      border-collapse: collapse;
      margin: 0 0 14px 48px;
    }
    .meta-table td {
      border: none;
      padding: 1px 6px 1px 0;
      vertical-align: top;
      background: transparent;
    }
    .party-list {
      margin: 8px 0 12px 18px;
      padding: 0;
    }
    .party-item {
      margin-bottom: 10px;
      list-style-type: decimal;
    }
    .party-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 3px;
    }
    .party-grid td {
      border: none;
      padding: 1px 6px 1px 0;
      vertical-align: top;
      background: transparent;
    }
    .party-grid td.lbl { width: 95px; }
    .party-grid td.sep { width: 12px; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9.5pt;
    }
    .data-table th,
    .data-table td {
      border: 1px solid #000000;
      padding: 5px 6px;
      background: transparent;
      color: #000000;
      vertical-align: top;
      text-align: left;
    }
    .data-table th {
      text-align: center;
      font-weight: bold;
    }
    .data-table td.col-center { text-align: center; width: 28px; }
    .data-table td.col-right { text-align: right; white-space: nowrap; }
    .data-table td.col-mono { font-family: "Courier New", Courier, monospace; font-size: 8.5pt; white-space: nowrap; }
    .data-table .sub { font-family: "Times New Roman", Times, serif; font-size: 8.5pt; }
    .data-table tr.total-row td { font-weight: bold; }
    .summary-note {
      font-size: 9.5pt;
      margin: 6px 0 14px;
    }
    .closing { margin: 10px 0 18px; }
    .place-date {
      width: 240px;
      margin-left: auto;
      margin-bottom: 18px;
      border-collapse: collapse;
    }
    .place-date td {
      border: none;
      padding: 1px 4px;
      background: transparent;
    }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: avoid;
    }
    .sig-table td {
      width: 50%;
      border: none;
      text-align: center;
      vertical-align: top;
      background: transparent;
      padding: 0 12px;
    }
    .sig-role { font-weight: bold; }
    .sig-space { height: 58px; }
    .sig-name { font-weight: bold; text-decoration: underline; }
    .pdp-foot {
      margin-top: 20px;
      font-size: 8.5pt;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="doc">
    <div class="header">
      <p>BERITA ACARA</p>
      <p>HASIL VERIFIKASI KLAIM PELAYANAN KESEHATAN</p>
      <p>${escapeHtml(hospitalSummary.toUpperCase())}</p>
      <p>BPJS KESEHATAN ${escapeHtml(unitName.toUpperCase())}</p>
    </div>

    <table class="meta-table">
      <tr>
        <td>Nomor</td>
        <td>:</td>
        <td>${escapeHtml(docNumber)}</td>
      </tr>
      <tr>
        <td>Periode</td>
        <td>:</td>
        <td>${escapeHtml(periodLabel)}</td>
      </tr>
    </table>

    <p>
      Pada hari ini ${escapeHtml(dayName)} tanggal ${escapeHtml(dayNum)} bulan ${escapeHtml(monthFull)} tahun ${escapeHtml(String(year))} yang bertanda tangan di bawah ini :
    </p>

    <ol class="party-list">
      <li class="party-item">
        <table class="party-grid">
          <tr>
            <td class="lbl">Nama</td>
            <td class="sep">:</td>
            <td>Perwakilan Tim Casemix (${escapeHtml(hospitalSummary)})</td>
          </tr>
          <tr>
            <td class="lbl">Jabatan</td>
            <td class="sep">:</td>
            <td>Penanggung Jawab Pengajuan Klaim FKRTL</td>
          </tr>
        </table>
        Bertindak untuk dan atas nama serta sah mewakili ${escapeHtml(hospitalSummary)}, selanjutnya disebut <strong>PIHAK PERTAMA</strong>.
      </li>
      <li class="party-item">
        <table class="party-grid">
          <tr>
            <td class="lbl">Nama</td>
            <td class="sep">:</td>
            <td>${escapeHtml(verifierName)}</td>
          </tr>
          <tr>
            <td class="lbl">Jabatan</td>
            <td class="sep">:</td>
            <td>Verifikator Klaim Cabang</td>
          </tr>
        </table>
        Bertindak untuk dan atas nama serta sah mewakili BPJS Kesehatan ${escapeHtml(unitName)}, selanjutnya disebut <strong>PIHAK KEDUA</strong>.
      </li>
    </ol>

    <p>
      Telah melakukan verifikasi dan penetapan status akhir berkas pengajuan klaim dengan rincian sebagai berikut :
    </p>

    <table class="data-table">
      <thead>
        <tr>
          <th>NO</th>
          <th>NO. SEP &amp; TGL</th>
          <th>PASIEN (UU PDP) &amp; FASKES</th>
          <th>TINDAKAN INA-CBG</th>
          <th>STATUS AKHIR</th>
          <th>BIAYA</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
        <tr class="total-row">
          <td colspan="5">JUMLAH TOTAL (${items.length} BERKAS TAMPILAN)</td>
          <td class="col-right">${escapeHtml(formatIdr(totalTariffIdr))}</td>
        </tr>
      </tbody>
    </table>

    <p class="summary-note">
      Rekapitulasi Cabang: ${summary.approvedCount} Disetujui (${escapeHtml(formatIdr(summary.approvedAmountIdr))}); ${summary.rejectedCount} Ditolak (${escapeHtml(formatIdr(summary.rejectedSavingsIdr))}); ${summary.falsePositiveCount} False Positive; ${summary.pendingRsCount} Pending RS; ${summary.needFinalCount} Menunggu Status Akhir.
    </p>

    <p class="closing">
      Demikian Berita Acara ini dibuat dengan sesungguhnya, untuk dapat dipergunakan sebagaimana mestinya.
    </p>

    <table class="place-date">
      <tr>
        <td>Dibuat di</td>
        <td>:</td>
        <td>${escapeHtml(cityName)}</td>
      </tr>
      <tr>
        <td>Tanggal</td>
        <td>:</td>
        <td>${escapeHtml(formatDateId(todayIso))}</td>
      </tr>
    </table>

    <table class="sig-table">
      <tr>
        <td>
          <div class="sig-role">PIHAK PERTAMA</div>
          <div>FKRTL MITRA</div>
          <div class="sig-space"></div>
          <div>( ........................................ )</div>
        </td>
        <td>
          <div class="sig-role">PIHAK KEDUA</div>
          <div>VERIFIKATOR</div>
          <div class="sig-space"></div>
          <div class="sig-name">${escapeHtml(verifierName.toUpperCase())}</div>
        </td>
      </tr>
    </table>

    <p class="pdp-foot">
      Catatan UU PDP No. 27/2022: Seluruh identitas peserta dalam Berita Acara ini disajikan dalam bentuk alias pseudonim.
    </p>
  </div>
</body>
</html>`
}

export function printBeritaAcaraHtml(input: PrintBahvInput): void {
  if (input.items.length === 0) {
    toast.info('Tidak ada berkas riwayat untuk disusun ke Berita Acara.')
    return
  }

  printHtmlDocument(
    buildBeritaAcaraHtml(input),
    'Gagal menyiapkan pratinjau cetak Berita Acara.',
  )
}
