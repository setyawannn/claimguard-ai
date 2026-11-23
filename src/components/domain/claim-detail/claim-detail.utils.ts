import {
  REQUIRED_DOCS_BY_TYPOLOGY,
  type StructuredAiNarrative,
} from '#/lib/ai-narrative'
import { formatDateId, formatIdr } from '#/lib/format'
import { FRAUD_TYPOLOGY_META } from '#/lib/status-tokens'
import type { ClaimDetailItem } from '#/schemas/claims.schema'

export { REQUIRED_DOCS_BY_TYPOLOGY }

export interface PendingCodingTarget {
  id: string
  label: string
  computeTariff: (claim: ClaimDetailItem) => number
}

export const PENDING_CODING_TARGETS: readonly PendingCodingTarget[] = [
  {
    id: 'severity_3_to_2',
    label: 'Turunkan Severity Level: III → II',
    computeTariff: (c) => Math.round(c.tariffIdr * 0.66),
  },
  {
    id: 'severity_2_to_1',
    label: 'Turunkan Severity Level: II → I',
    computeTariff: (c) => Math.round(c.tariffIdr * 0.75),
  },
  {
    id: 'peer_group_tariff',
    label: 'Sesuaikan dengan Rata-Rata Peer Group',
    computeTariff: (c) => c.peerAvgTariffIdr,
  },
  {
    id: 'icd9_correction',
    label: 'Hapus Unbundling / Koreksi Prosedur ICD-9',
    computeTariff: (c) => Math.round(c.tariffIdr * 0.8),
  },
]

export function buildDefaultStructuredNarrative(
  claim: ClaimDetailItem,
): StructuredAiNarrative {
  const diffIdr = claim.tariffIdr - claim.peerAvgTariffIdr
  const diffNote =
    diffIdr > 0
      ? `selisih +${formatIdr(diffIdr)} di atas rata-rata peer group (${formatIdr(claim.peerAvgTariffIdr)})`
      : `sesuai kisaran peer group (${formatIdr(claim.peerAvgTariffIdr)})`

  return {
    ringkasanKasus: `${claim.patientAlias} (${claim.patientGender}, ${claim.patientAge} tahun) menjalani ${claim.inacbgDescription} (${claim.inacbgCode}) di ${claim.hospitalName} dengan DPJP ${claim.doctorName} pada ${formatDateId(claim.admissionDate)} – ${formatDateId(claim.dischargeDate)}.`,
    analisisAnomali: `Sinyal ${FRAUD_TYPOLOGY_META[claim.fraudTypology]}: ${claim.signalSummary}, tercatat ${diffNote}.`,
    fokusPemeriksaan: [
      `Verifikasi kesesuaian resume medis dan kode diagnosis ${claim.icd10Primary}.`,
      `Periksa kelengkapan bukti penunjang sesuai tipologi anomali yang terdeteksi.`,
    ],
  }
}

export function buildClarificationDraft(
  claim: ClaimDetailItem,
  docs: readonly string[],
): string {
  const list =
    docs.length > 0
      ? docs.map((item, idx) => `${idx + 1}. ${item}`).join('\n')
      : '1. Resume medis & dokumen pendukung tindakan'

  return `Yth. Tim Casemix ${claim.hospitalName},\n\nMohon konfirmasi & lampiran berkas untuk SEP ${claim.noSep} (${claim.patientAlias} · ${claim.inacbgDescription}) terkait sinyal ${claim.signalSummary}:\n${list}\n\nMohon unggah melalui e-Office BPJS Kesehatan sebelum batas SLA.`
}
