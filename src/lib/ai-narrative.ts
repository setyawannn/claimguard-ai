import type { FraudTypology } from './status-tokens'

export interface StructuredAiNarrative {
  ringkasanKasus: string
  analisisAnomali: string
  fokusPemeriksaan: string[]
}

export const REQUIRED_DOCS_BY_TYPOLOGY: Record<
  FraudTypology,
  readonly string[]
> = {
  repeat_billing: [
    'Rekaman EKG Darurat Baru',
    'Hasil Enzim Troponin / CK-MB',
    'Laporan Cath Lab & Indikasi Medis',
  ],
  phantom_billing: [
    'Catatan Vital Perawat & CPPT Harian',
    'Bukti Pemberian Obat / Rekam Infus',
    'Hasil Penunjang Laboratorium / Radiologi',
  ],
  upcoding: [
    'Resume Medis & Lembar Operasi Lengkap',
    'Hasil Pemeriksaan Penunjang Penyulit',
    'Lembar Verifikasi Coding Casemix RS',
  ],
  unbundling: [
    'Rincian Billing Farmasi & BHP Kamar Operasi',
    'Resep Asli & Bukti Distribusi Paket INA-CBG',
  ],
  self_referral: [
    'Surat Rujukan Berjenjang Resmi FKTP',
    'Catatan Konsul Dokter Pengirim & Jadwal Praktik',
  ],
  none: ['Resume Medis Lengkap', 'Bukti Tindakan Klinis'],
}

export function sanitizeAiText(raw: string, preserveNewlines = false): string {
  const withoutControls = raw
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    .replace(/```[a-zA-Z0-9_-]*\n?/g, '')
    .replace(/`/g, '')
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, '')
    .replace(/\*\*|__/g, '')
    .replace(/(^|\s)\*(?=\S)|(?<=\S)\*(?=\s|$|[.,;:!?])/g, '$1')
    .replace(/^[ \t]*[•*-][ \t]+/gm, '')

  if (preserveNewlines) {
    return withoutControls
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  return withoutControls.replace(/\s+/g, ' ').trim()
}

export function parseAiNarrativeCache(
  raw: string | null,
): StructuredAiNarrative | null {
  if (!raw || !raw.trim()) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StructuredAiNarrative>
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.ringkasanKasus === 'string' &&
      parsed.ringkasanKasus.trim().length > 0
    ) {
      const fokus = Array.isArray(parsed.fokusPemeriksaan)
        ? parsed.fokusPemeriksaan
            .filter((item): item is string => typeof item === 'string')
            .map((item) => sanitizeAiText(item))
            .filter(Boolean)
        : []

      return {
        ringkasanKasus: sanitizeAiText(parsed.ringkasanKasus),
        analisisAnomali:
          typeof parsed.analisisAnomali === 'string'
            ? sanitizeAiText(parsed.analisisAnomali)
            : '',
        fokusPemeriksaan: fokus,
      }
    }
  } catch {
    // Fallback untuk cache string polos versi sebelumnya
  }

  const clean = sanitizeAiText(raw)
  if (!clean) return null
  return {
    ringkasanKasus: clean,
    analisisAnomali: '',
    fokusPemeriksaan: [],
  }
}
