import { sanitizeAiText, type StructuredAiNarrative } from '#/lib/ai-narrative'
import { formatDateId, formatIdr } from '#/lib/format'
import { FRAUD_TYPOLOGY_META } from '#/lib/status-tokens'
import type { ClaimDetailItem } from '#/schemas/claims.schema'

const DEFAULT_PRIMARY_MODEL = 'gemini-2.5-flash-lite'
const FALLBACK_MODEL = 'gemini-2.5-flash'
const GEMINI_TIMEOUT_MS = 12_000

export interface AiCopilotResult {
  narrative: StructuredAiNarrative
  clarificationDraft: string
  source: 'gemini' | 'fallback'
}

interface WorkerAiConfig {
  apiKey?: string
  model?: string
}

interface RawGeminiJsonPayload {
  ringkasanKasus?: unknown
  analisisAnomali?: unknown
  fokusPemeriksaan?: unknown
  drafKlarifikasi?: unknown
}

export function buildFallbackStructuredAi(
  claim: ClaimDetailItem,
  requiredDocs: readonly string[],
): AiCopilotResult {
  const serviceLabel =
    claim.serviceType === 'rawat_inap' ? 'rawat inap' : 'rawat jalan'
  const typologyLabel = FRAUD_TYPOLOGY_META[claim.fraudTypology]
  const diffIdr = claim.tariffIdr - claim.peerAvgTariffIdr
  const diffPct =
    claim.peerAvgTariffIdr > 0
      ? Math.round((diffIdr / claim.peerAvgTariffIdr) * 100)
      : 0

  const tariffComparison =
    diffIdr > 0
      ? `Nilai tagihan ${formatIdr(claim.tariffIdr)} tercatat ${diffPct}% lebih tinggi (+${formatIdr(diffIdr)}) dibanding rata-rata peer group kelas RS Tipe ${claim.facilityType} sebesar ${formatIdr(claim.peerAvgTariffIdr)}.`
      : `Nilai tagihan ${formatIdr(claim.tariffIdr)} masih berada pada rentang rata-rata peer group kelas RS Tipe ${claim.facilityType} (${formatIdr(claim.peerAvgTariffIdr)}).`

  const narrative: StructuredAiNarrative = {
    ringkasanKasus: sanitizeAiText(
      `${claim.patientAlias} (${claim.patientGender}, ${claim.patientAge} tahun) menerima layanan ${serviceLabel} kelas ${claim.careClass} di ${claim.hospitalName} dengan diagnosis utama ${claim.icd10Primary} dan tindakan ${claim.inacbgDescription} (${claim.inacbgCode}) oleh DPJP ${claim.doctorName}. Episode perawatan berlangsung ${claim.losDays} hari mulai ${formatDateId(claim.admissionDate)} hingga ${formatDateId(claim.dischargeDate)} dengan asal rujukan ${claim.referringFacility}.`,
    ),
    analisisAnomali: sanitizeAiText(
      `Mesin deteksi memberi skor risiko ${claim.riskScore} dari 100 (Medis ${claim.scoreMedical}, Statistik ${claim.scoreStatistical}, Jaringan ${claim.scoreNetwork}) dengan pola utama ${typologyLabel}. Sinyal terdeteksi menunjukkan ${claim.signalSummary}. ${tariffComparison}`,
    ),
    fokusPemeriksaan: [
      `Cocokkan kesesuaian resume medis, waktu masuk keluar, dan indikasi klinis utama (${claim.icd10Primary}) terhadap paket ${claim.inacbgCode}.`,
      requiredDocs[0]
        ? `Periksa kelengkapan dokumen kunci dari rumah sakit, terutama ${requiredDocs[0]}.`
        : 'Pastikan seluruh dokumen penunjang diagnostik dan lembar tindakan terlampir resmi.',
      diffIdr > 0
        ? `Evaluasi kewajaran komponen biaya selisih +${formatIdr(diffIdr)} sebelum menentukan persetujuan atau pending koding.`
        : 'Konfirmasi apakah terdapat episode berulang atau rujukan berjenjang tidak wajar sebelum finalisasi putusan.',
    ].map((item) => sanitizeAiText(item)),
  }

  const docLines =
    requiredDocs.length > 0
      ? requiredDocs.map((doc, idx) => `${idx + 1}. ${sanitizeAiText(doc)}`)
      : ['1. Resume medis lengkap dan bukti penunjang tindakan klinis']

  const clarificationDraft = sanitizeAiText(
    [
      `Yth. Tim Casemix ${claim.hospitalName},`,
      '',
      `Dalam rangka verifikasi klaim SEP ${claim.noSep} atas ${claim.patientAlias} (${claim.inacbgDescription}, kode ${claim.inacbgCode}, tagihan ${formatIdr(claim.tariffIdr)}), ditemukan indikasi ${claim.signalSummary} yang memerlukan konfirmasi lanjutan.`,
      '',
      'Mohon dapat melampirkan dokumen pendukung berikut melalui portal e-Office BPJS Kesehatan sebelum batas SLA berakhir:',
      ...docLines,
      '',
      'Terima kasih atas kerja sama dan percepatan konfirmasinya.',
    ].join('\n'),
    true,
  )

  return {
    narrative,
    clarificationDraft,
    source: 'fallback',
  }
}

function buildCompactPrompt(
  claim: ClaimDetailItem,
  requiredDocs: readonly string[],
): string {
  const facts = {
    pasien: `${claim.patientAlias} (${claim.patientGender}, ${claim.patientAge} thn)`,
    sep: claim.noSep,
    rs: `${claim.hospitalName} (Tipe ${claim.facilityType})`,
    dpjp: `${claim.doctorName} (${claim.doctorSpecialty})`,
    rujukan: claim.referringFacility,
    layanan: `${claim.serviceType} kelas ${claim.careClass}, LOS ${claim.losDays} hr (${claim.admissionDate} s.d. ${claim.dischargeDate})`,
    kode: `${claim.icd10Primary} | ${claim.inacbgCode} (${claim.inacbgDescription})`,
    tarifDiajukanIdr: claim.tariffIdr,
    tarifPeerGroupIdr: claim.peerAvgTariffIdr,
    skor: `Total ${claim.riskScore}/100 (Medis ${claim.scoreMedical}, Statistik ${claim.scoreStatistical}, Jaringan ${claim.scoreNetwork})`,
    tipologi: FRAUD_TYPOLOGY_META[claim.fraudTypology],
    sinyal: claim.signalSummary,
    dokumenDibutuhkan: requiredDocs,
  }

  return [
    'Anda adalah asisten auditor klinis BPJS Kesehatan yang ringkas, akurat, dan berbahasa Indonesia baku.',
    'Gunakan HANYA fakta JSON berikut (jangan mengarang angka/diagnosis):',
    JSON.stringify(facts),
    'Kembalikan JSON valid dengan 4 field:',
    '- ringkasanKasus: 2-3 kalimat padat merangkum profil klinis pasien, tindakan INA-CBG, DPJP, RS, dan lama rawat.',
    '- analisisAnomali: 2-3 kalimat menjelaskan alasan skor risiko, sinyal anomali, dan perbandingan tarif vs peer group.',
    '- fokusPemeriksaan: array tepat 3 kalimat singkat hal yang harus dicek verifikator.',
    '- drafKlarifikasi: surat e-Office resmi dan sopan kepada tim Casemix RS berisi daftar dokumen yang diminta.',
    'ATURAN KERAS: Dilarang menulis simbol Markdown apa pun seperti **, *, #, _, `, atau bullet simbol.',
  ].join('\n')
}

async function callGeminiModel(
  model: string,
  apiKey: string,
  prompt: string,
): Promise<{ status: number; text: string | null }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 650,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    },
  )

  if (!response.ok) {
    return { status: response.status, text: null }
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
  return { status: response.status, text }
}

export async function generateStructuredClaimAi(
  claim: ClaimDetailItem,
  requiredDocs: readonly string[],
  config: WorkerAiConfig,
): Promise<AiCopilotResult> {
  const fallback = buildFallbackStructuredAi(claim, requiredDocs)
  const apiKey = config.apiKey?.trim()
  if (!apiKey || apiKey.startsWith('your_')) {
    return fallback
  }

  const primaryModel = config.model?.trim() || DEFAULT_PRIMARY_MODEL
  const prompt = buildCompactPrompt(claim, requiredDocs)

  try {
    let result = await callGeminiModel(primaryModel, apiKey, prompt)
    if (result.status === 404 && primaryModel !== FALLBACK_MODEL) {
      result = await callGeminiModel(FALLBACK_MODEL, apiKey, prompt)
    }
    if (!result.text) {
      return fallback
    }

    const parsed = JSON.parse(result.text) as RawGeminiJsonPayload
    const ringkasanKasus =
      typeof parsed.ringkasanKasus === 'string'
        ? sanitizeAiText(parsed.ringkasanKasus)
        : ''
    const analisisAnomali =
      typeof parsed.analisisAnomali === 'string'
        ? sanitizeAiText(parsed.analisisAnomali)
        : ''
    const fokusPemeriksaan = Array.isArray(parsed.fokusPemeriksaan)
      ? parsed.fokusPemeriksaan
          .filter((item): item is string => typeof item === 'string')
          .map((item) => sanitizeAiText(item))
          .filter(Boolean)
          .slice(0, 4)
      : []
    const drafKlarifikasi =
      typeof parsed.drafKlarifikasi === 'string'
        ? sanitizeAiText(parsed.drafKlarifikasi, true)
        : ''

    if (!ringkasanKasus || !analisisAnomali) {
      return fallback
    }

    return {
      narrative: {
        ringkasanKasus,
        analisisAnomali,
        fokusPemeriksaan:
          fokusPemeriksaan.length > 0
            ? fokusPemeriksaan
            : fallback.narrative.fokusPemeriksaan,
      },
      clarificationDraft: drafKlarifikasi || fallback.clarificationDraft,
      source: 'gemini',
    }
  } catch {
    return fallback
  }
}
