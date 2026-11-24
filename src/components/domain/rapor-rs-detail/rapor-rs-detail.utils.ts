import { formatDateId, formatIdr, formatIdrCompact, formatPercent } from '#/lib/format'
import { escapeHtml, printHtmlDocument } from '#/lib/print-html'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import type {
  HospitalDetailItem,
  PksRecommendationInput,
} from '#/schemas/hospitals.schema'

export function buildDefaultAddendumRequirements(
  hospital: HospitalDetailItem,
): string[] {
  const tgrText =
    hospital.tgrBurdenIdr > 0
      ? `Pelunasan TGR ${formatIdrCompact(hospital.tgrBurdenIdr)} maks. 30 Nov 2026`
      : 'Pelaporan audit koding INA-CBG triwulan tepat waktu'

  return [
    tgrText,
    'Integrasi Real-Time Kapasitas Kasur Aplicares',
    'Kepatuhan verifikasi klaim & respons klarifikasi < 48 jam',
  ]
}

const POLICY_LABELS: Record<PksRecommendationInput['recommendedPolicy'], string> = {
  pks_bersyarat: 'PKS Bersyarat 6 Bulan',
  teguran_sp1: 'Teguran Tertulis SP-1',
  pembinaan: 'Pembinaan Koding Casemix',
  perpanjang: 'Perpanjangan Penuh PKS 2027',
}

export function buildPksDraftLetter(
  hospital: HospitalDetailItem,
  policy: PksRecommendationInput['recommendedPolicy'],
  requirements: readonly string[],
): string {
  const tgrPart =
    hospital.tgrBurdenIdr > 0
      ? ` dengan kewajiban penyelesaian TGR ${formatIdrCompact(hospital.tgrBurdenIdr)}`
      : ''

  const reqLines =
    requirements.length > 0
      ? `\nSyarat wajib addendum: ${requirements.join('; ')}.`
      : ''

  return `Yth. Direktur ${hospital.name}, berdasarkan Rapor Q3 (Skor ${hospital.complianceScore}/100 · Grade ${hospital.complianceGrade}) & BAP Pengawasan Wilayah, ditetapkan rekomendasi ${POLICY_LABELS[policy]}${tgrPart}.${reqLines}`
}

export function printRaporBapHtml(
  hospital: HospitalDetailItem,
  executiveName: string,
  unitName: string,
): void {
  const todayIso = new Date().toISOString().slice(0, 10)
  const docNumber = `RAPOR-PKS/${hospital.code}/${todayIso.replace(/-/g, '')}`
  const unitLabel = unitName.replace(/^KC\s+/i, '').trim() || 'Malang'

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Rapor Kepatuhan &amp; BAP - ${escapeHtml(hospital.name)}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; background: #fff; font-family: "Times New Roman", Times, serif; font-size: 10.5pt; line-height: 1.45; }
    .header { text-align: center; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; line-height: 1.35; }
    .header p { margin: 0; }
    .meta { margin-bottom: 12px; font-size: 10pt; }
    .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9.5pt; }
    .data-table th, .data-table td { border: 1px solid #000; padding: 5px 6px; background: transparent; text-align: left; vertical-align: top; }
    .data-table th { text-align: center; font-weight: bold; }
    .col-center { text-align: center; }
    .sig-table { width: 100%; border-collapse: collapse; margin-top: 24px; page-break-inside: avoid; }
    .sig-table td { width: 50%; border: none; text-align: center; vertical-align: top; background: transparent; padding: 0 12px; }
    .sig-space { height: 54px; }
    .sig-name { font-weight: bold; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <p>RAPOR KEPATUHAN FKRTL &amp; BERITA ACARA EVALUASI PKS</p>
    <p>${escapeHtml(hospital.name.toUpperCase())}</p>
    <p>BPJS KESEHATAN KANTOR CABANG ${escapeHtml(unitLabel.toUpperCase())}</p>
  </div>
  <div class="meta">
    <div>Nomor Dokumen : ${escapeHtml(docNumber)} · Tanggal : ${escapeHtml(formatDateId(todayIso))}</div>
    <div>Kode FKRTL : ${escapeHtml(hospital.code)} · Tipe ${escapeHtml(hospital.facilityType)} (${hospital.bedCapacity} TT) · Direktur : ${escapeHtml(hospital.directorName)}</div>
    <div>Skor Kepatuhan : <strong>${hospital.complianceScore}/100 (Grade ${escapeHtml(hospital.complianceGrade)})</strong> · Status PKS : ${escapeHtml(PKS_STATUS_META[hospital.pksStatus].label)} · Beban TGR : ${escapeHtml(formatIdr(hospital.tgrBurdenIdr))}</div>
  </div>
  <table class="data-table">
    <thead>
      <tr>
        <th>PILAR KEPATUHAN PERMENKES 16/2019</th>
        <th>CAPAIAN</th>
        <th>KETERANGAN AUDIT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Pilar 1 · Kewajaran BOR &amp; Kapasitas Aplicares</td>
        <td class="col-center">Skor ${hospital.pilarBorScore}/100</td>
        <td>BOR Total ${escapeHtml(formatPercent(hospital.borTotalPct))} · VIP/Khusus ${escapeHtml(formatPercent(hospital.borCardioVipPct))}</td>
      </tr>
      <tr>
        <td>Pilar 2 · Akurasi Koding INA-CBG</td>
        <td class="col-center">Skor ${hospital.pilarCodingScore}/100</td>
        <td>Modus dominan: ${escapeHtml(hospital.dominantTypology)}</td>
      </tr>
      <tr>
        <td>Pilar 3 · Kinerja Klaim Bersih (Fast-Track)</td>
        <td class="col-center">${escapeHtml(formatPercent(hospital.pilarFastTrackPct))}</td>
        <td>Rata-rata volume ${hospital.monthlyClaimAvg.toLocaleString('id-ID')} SEP/bulan</td>
      </tr>
      <tr>
        <td>Pilar 4 · Respons Klarifikasi &amp; Tindak Lanjut</td>
        <td class="col-center">Skor ${hospital.pilarResponseScore}/100</td>
        <td>${hospital.cluster ? `Kluster ${escapeHtml(hospital.cluster.clusterCode)} (${hospital.cluster.escalatedClaimCount} berkas)` : 'Tidak ada eskalasi kluster aktif'}</td>
      </tr>
    </tbody>
  </table>
  <table class="sig-table">
    <tr>
      <td>
        <div><strong>PIHAK PERTAMA</strong></div>
        <div>DIREKTUR ${escapeHtml(hospital.name.toUpperCase())}</div>
        <div class="sig-space"></div>
        <div class="sig-name">${escapeHtml(hospital.directorName.toUpperCase())}</div>
      </td>
      <td>
        <div><strong>PIHAK KEDUA</strong></div>
        <div>KEPALA CABANG ${escapeHtml(unitLabel.toUpperCase())}</div>
        <div class="sig-space"></div>
        <div class="sig-name">${escapeHtml(executiveName.toUpperCase())}</div>
      </td>
    </tr>
  </table>
</body>
</html>`

  printHtmlDocument(html, 'Gagal menyiapkan pratinjau cetak Rapor & BAP.')
}
