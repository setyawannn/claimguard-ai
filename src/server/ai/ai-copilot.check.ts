import assert from 'node:assert/strict'
import { parseAiNarrativeCache, sanitizeAiText } from '#/lib/ai-narrative'
import type { ClaimDetailItem } from '#/schemas/claims.schema'
import { buildFallbackStructuredAi } from './gemini-copilot'

const dirty =
  '### **Ringkasan Kasus**\n* `Pasien #B-9021` menjalani **Kateterisasi PCI**.\n• Skor tinggi __perlu dicek__.'
const cleaned = sanitizeAiText(dirty)

assert.equal(cleaned.includes('**'), false)
assert.equal(cleaned.includes('###'), false)
assert.equal(cleaned.includes('`'), false)
assert.equal(cleaned.includes('__'), false)
assert.equal(cleaned.includes('•'), false)
assert.match(cleaned, /Ringkasan Kasus/)
assert.match(cleaned, /Pasien #B-9021/)

const multiline = sanitizeAiText('Yth. Tim RS,\n\n* Lampirkan EKG\n\n\nTerima kasih', true)
assert.equal(multiline, 'Yth. Tim RS,\n\nLampirkan EKG\n\nTerima kasih')

const parsedStructured = parseAiNarrativeCache(
  JSON.stringify({
    ringkasanKasus: '**Kasus** singkat',
    analisisAnomali: '### Deviasi +40%',
    fokusPemeriksaan: ['- Cek EKG', '`Cek Troponin`'],
  }),
)
assert.ok(parsedStructured)
assert.equal(parsedStructured.ringkasanKasus, 'Kasus singkat')
assert.equal(parsedStructured.analisisAnomali, 'Deviasi +40%')
assert.deepEqual(parsedStructured.fokusPemeriksaan, ['Cek EKG', 'Cek Troponin'])

const parsedLegacy = parseAiNarrativeCache('**Narasi** lama tanpa JSON')
assert.equal(parsedLegacy?.ringkasanKasus, 'Narasi lama tanpa JSON')
assert.equal(parseAiNarrativeCache(null), null)

const sampleClaim: ClaimDetailItem = {
  id: 'clm-0123',
  noSep: '0112R0010924V000123',
  patientAlias: 'Pasien #B-9021',
  patientNikMasked: '357301******0021',
  patientGender: 'L',
  patientAge: 58,
  admissionDate: '2026-11-18',
  dischargeDate: '2026-11-21',
  losDays: 3,
  serviceType: 'rawat_inap',
  careClass: 1,
  hospitalId: '0195R008',
  hospitalName: 'RSUD Medika Malang',
  facilityType: 'B',
  referringFacility: 'Klinik Utama Jantung Malang',
  doctorId: 'SP-JNT-088',
  doctorName: 'dr. Hendra Sp.JP',
  doctorSpecialty: 'Kardiologi',
  icd10Primary: 'I21.4',
  inacbgCode: 'I-1-15-II',
  inacbgDescription: 'Kateterisasi PCI',
  tariffIdr: 18_700_000,
  peerAvgTariffIdr: 11_400_000,
  hospitalRealCostIdr: 17_950_000,
  scoreMedical: 95,
  scoreStatistical: 90,
  scoreNetwork: 75,
  riskScore: 88,
  riskZone: 'merah',
  fraudTypology: 'repeat_billing',
  signalSummary: 'Repeat Billing Lintas RS · Tindakan sama dlm 12 hr',
  status: 'belum_dicek',
  slaDueAt: '2026-11-29T17:00:00Z',
  clarificationRequestedAt: null,
  hospitalResponseNote: null,
  hospitalRespondedAt: null,
  aiNarrativeCache: null,
  aiDraftCache: null,
  escalatedToPkjkn: false,
  decisionNote: null,
  revisedTariffIdr: null,
}

const fb = buildFallbackStructuredAi(sampleClaim, [
  'Rekaman EKG Darurat Baru',
  'Hasil Enzim Troponin / CK-MB',
])
assert.ok(fb.narrative.ringkasanKasus.length > 80)
assert.ok(fb.narrative.analisisAnomali.length > 80)
assert.equal(fb.narrative.fokusPemeriksaan.length, 3)
assert.ok(fb.clarificationDraft.includes('RSUD Medika Malang'))
assert.equal(fb.clarificationDraft.includes('**'), false)

console.log('ai-copilot.check.ts passed')
