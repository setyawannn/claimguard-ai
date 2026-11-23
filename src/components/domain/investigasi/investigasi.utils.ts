import { toast } from 'sonner'
import { formatDateId, formatIdr, formatIdrCompact, formatPercent } from '#/lib/format'
import { escapeHtml, printHtmlDocument } from '#/lib/print-html'
import type {
  ClusterInvestigationDetail,
  ConstellationNodeDoc,
  GraphNodeKey,
} from '#/schemas/clusters.schema'

export function buildNodeDraftText(
  detail: ClusterInvestigationDetail,
  nodeKey: GraphNodeKey,
): string {
  const compactLoss = formatIdrCompact(detail.potentialLossIdr)
  if (nodeKey === 'billing_hospital') {
    return [
      `Yth. Direktur ${detail.hospitalName}`,
      `Perihal: Evaluasi Kepatuhan Klaim & Konfirmasi BOR (${detail.clusterCode})`,
      '',
      `Berdasarkan pemantauan Pengawasan Anti-Fraud ${detail.branchName} / Divre Jatim, ditemukan ${detail.escalatedClaimCount} klaim bermasalah senilai ${compactLoss} dengan okupansi tercatat ${formatPercent(Math.max(detail.borTotalPct, detail.borCardioVipPct))} dari kapasitas ${detail.bedCapacity} TT.`,
      'Mohon menyiapkan dokumen register ruangan, log CCTV unit terkait, dan tim casemix untuk jadwal evaluasi PKS serta klarifikasi lapangan.',
    ].join('\n')
  }

  return [
    `NOTA DINAS PENGAWASAN ANTI-FRAUD DIVRE JATIM`,
    `Nomor Referensi: SPT-${detail.id}/DIVRE-JTM`,
    `Objek Pemeriksaan: ${detail.hospitalName} · ${detail.doctorName} (${detail.clusterCode})`,
    '',
    `Sehubungan dengan eskalasi ${detail.escalatedClaimCount} berkas klaim senilai ${compactLoss} (Skor Risiko AI: ${detail.riskScore}/100), tim pengawas menetapkan pemeriksaan lapangan / verifikasi dokumen untuk mengecek kesesuaian jadwal praktik ${detail.doctorName}, log tindakan, dan alur rujukan.`,
  ].join('\n')
}

export function exportClusterChronologyCsv(
  detail: ClusterInvestigationDetail,
): void {
  const headers = [
    'Kluster',
    'No SEP',
    'Pasien (UU PDP)',
    'Faskes Perujuk',
    'Faskes Penagih',
    'DPJP',
    'Tgl Masuk',
    'Tgl Pulang',
    'INA-CBG',
    'Tagihan IDR',
    'Skor AI',
  ]

  const rows =
    detail.claimSamples.length > 0
      ? detail.claimSamples.map((s) => [
          detail.clusterCode,
          s.noSep,
          `"${s.patientAlias}"`,
          `"${s.referringFacility}"`,
          `"${detail.hospitalName}"`,
          `"${detail.doctorName}"`,
          s.admissionDate,
          s.dischargeDate,
          `"${s.inacbgDescription} (${s.inacbgCode})"`,
          String(s.tariffIdr),
          String(s.riskScore),
        ])
      : [
          [
            detail.clusterCode,
            '-',
            `"${detail.escalatedClaimCount} Pasien Terdampak"`,
            `"${detail.nodes.referring_hospital.title}"`,
            `"${detail.hospitalName}"`,
            `"${detail.doctorName}"`,
            '-',
            '-',
            `"${detail.fraudTypology}"`,
            String(detail.potentialLossIdr),
            String(detail.riskScore),
          ],
        ]

  const csv = `\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `kronologi-${detail.id.toLowerCase()}.csv`
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`Tabel kronologi ${detail.clusterCode} (.CSV) berhasil diunduh.`)
}

export function printInvestigationDocHtml(
  detail: ClusterInvestigationDetail,
  docType: NonNullable<ConstellationNodeDoc['docType']>,
  auditorName: string,
): void {
  const todayIso = new Date().toISOString().slice(0, 10)
  const docTitles: Record<typeof docType, string> = {
    dpjp_schedule: `REKAP JADWAL PRAKTIK & KLAIM ${detail.doctorName.toUpperCase()}`,
    sidak_checklist: `CHECKLIST PEMERIKSAAN LAPANGAN (SIDAK) · ${detail.hospitalName.toUpperCase()}`,
    sep_bundle: `BUNDEL LAMPIRAN KLAIM ESKALASI ${detail.clusterCode}`,
    referring_summary: `REKAP RUJUKAN FASKES PERUJUK · ${detail.clusterCode}`,
  }

  const checklistRows =
    docType === 'sidak_checklist'
      ? `
        <h3>Daftar Periksa Lapangan</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>NO</th>
              <th>OBJEK PEMERIKSAAN FISIK</th>
              <th>TARGET VERIFIKASI</th>
              <th>HASIL</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="col-center">1</td><td>Rekaman CCTV Unit / Cath Lab</td><td>Kesesuaian jam tindakan & kehadiran DPJP</td><td>[ ] Sesuai  [ ] Temuan</td></tr>
            <tr><td class="col-center">2</td><td>Buku Register Ruangan & IGD</td><td>Verifikasi ${detail.escalatedClaimCount} entri pasien vs kapasitas ${detail.bedCapacity} TT</td><td>[ ] Sesuai  [ ] Temuan</td></tr>
            <tr><td class="col-center">3</td><td>Berita Acara Pemeriksaan (BAP)</td><td>Pengesahan Pihak RS & Pengawas Wilayah</td><td>[ ] Ditandatangani</td></tr>
          </tbody>
        </table>`
      : ''

  const sampleRows =
    detail.claimSamples.length > 0
      ? detail.claimSamples
          .map(
            (s, i) => `
          <tr>
            <td class="col-center">${i + 1}</td>
            <td class="col-mono">${escapeHtml(s.noSep)}</td>
            <td>${escapeHtml(s.patientAlias)}</td>
            <td>${escapeHtml(s.referringFacility)}</td>
            <td>${escapeHtml(s.inacbgDescription)} (${escapeHtml(s.inacbgCode)})</td>
            <td class="col-right">${escapeHtml(formatIdr(s.tariffIdr))}</td>
          </tr>`,
          )
          .join('')
      : `<tr><td colspan="6">Total ${detail.escalatedClaimCount} berkas tereskalasi pada kluster ${escapeHtml(detail.clusterCode)} senilai ${escapeHtml(formatIdr(detail.potentialLossIdr))}.</td></tr>`

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(docTitles[docType])}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; background: #fff; font-family: "Times New Roman", Times, serif; font-size: 10.5pt; line-height: 1.45; }
    .header { text-align: center; font-weight: bold; margin-bottom: 16px; }
    .header p { margin: 0; }
    .meta { margin-bottom: 12px; font-size: 10pt; }
    .data-table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 9pt; }
    .data-table th, .data-table td { border: 1px solid #000; padding: 5px 6px; background: transparent; text-align: left; vertical-align: top; }
    .data-table th { text-align: center; font-weight: bold; }
    .col-center { text-align: center; width: 28px; }
    .col-right { text-align: right; white-space: nowrap; }
    .col-mono { font-family: "Courier New", Courier, monospace; font-size: 8.5pt; white-space: nowrap; }
    .sig { margin-top: 26px; width: 230px; margin-left: auto; text-align: center; }
    .sig-space { height: 54px; }
  </style>
</head>
<body>
  <div class="header">
    <p>BPJS KESEHATAN · KEDEPUTIAN WILAYAH JAWA TIMUR</p>
    <p>${escapeHtml(docTitles[docType])}</p>
  </div>
  <div class="meta">
    <div>Kluster: <strong>${escapeHtml(detail.clusterCode)}</strong> · Cabang: ${escapeHtml(detail.branchName)}</div>
    <div>Faskes Penagih: ${escapeHtml(detail.hospitalName)} · DPJP: ${escapeHtml(detail.doctorName)}</div>
    <div>Potensi Kerugian: ${escapeHtml(formatIdr(detail.potentialLossIdr))} (${detail.escalatedClaimCount} berkas) · Tanggal Cetak: ${escapeHtml(formatDateId(todayIso))}</div>
  </div>
  ${checklistRows}
  <table class="data-table">
    <thead>
      <tr>
        <th>NO</th>
        <th>NO. SEP</th>
        <th>PASIEN (UU PDP)</th>
        <th>FASKES PERUJUK</th>
        <th>TINDAKAN INA-CBG</th>
        <th>TAGIHAN</th>
      </tr>
    </thead>
    <tbody>${sampleRows}</tbody>
  </table>
  <div class="sig">
    <div>Pengawas Anti-Fraud Wilayah</div>
    <div class="sig-space"></div>
    <div><strong>${escapeHtml(auditorName)}</strong></div>
  </div>
</body>
</html>`

  printHtmlDocument(html, 'Gagal menyiapkan pratinjau cetak dokumen investigasi.')
}
