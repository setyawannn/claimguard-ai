import { z } from 'zod'

export const claimStatusSchema = z.enum([
  'belum_dicek',
  'klarifikasi',
  'balasan_rs',
  'pending_rs',
  'disetujui',
  'false_positive',
  'ditolak',
])

export const fraudTypologySchema = z.enum([
  'none',
  'repeat_billing',
  'phantom_billing',
  'upcoding',
  'unbundling',
  'self_referral',
])

export const riskZoneSchema = z.enum(['hijau', 'kuning', 'merah'])

export const queueTabSchema = z.enum([
  'perlu_telaah',
  'belum_dicek',
  'klarifikasi',
  'selesai',
])

export const claimsFilterSchema = z.object({
  tab: queueTabSchema.default('perlu_telaah'),
  hospitalId: z.string().max(32).optional(),
  status: claimStatusSchema.optional(),
  typology: fraudTypologySchema.optional(),
  sort: z.enum(['score_sla', 'tariff_desc', 'newest']).default('score_sla'),
  search: z.string().trim().max(64).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})
export type ClaimsFilterInput = z.infer<typeof claimsFilterSchema>

export const claimDecisionInputSchema = z.object({
  claimId: z.string().min(1).max(64),
  decision: z.enum([
    'klarifikasi',
    'pending_rs',
    'disetujui',
    'false_positive',
    'ditolak',
  ]),
  note: z.string().trim().min(5, 'Catatan alasan minimal 5 karakter').max(1000),
  revisedTariffIdr: z.number().int().nonnegative().optional(),
  escalateToPkjkn: z.boolean().optional(),
  hospitalResponded: z.boolean().optional(),
})
export type ClaimDecisionInput = z.infer<typeof claimDecisionInputSchema>

export const bulkClaimActionInputSchema = z.object({
  claimIds: z.array(z.string().min(1).max(64)).min(1).max(50),
  action: z.enum(['klarifikasi', 'disetujui']),
  note: z.string().trim().min(3, 'Catatan minimal 3 karakter').max(500),
})
export type BulkClaimActionInput = z.infer<typeof bulkClaimActionInputSchema>

export const approveFastTrackInputSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, 'Catatan minimal 3 karakter')
    .max(500)
    .default('Persetujuan massal Fast-Track klaim zona hijau (Skor 0–39).'),
})
export type ApproveFastTrackInput = z.infer<typeof approveFastTrackInputSchema>

export interface ClaimQueueItem {
  id: string
  noSep: string
  slaDueAt: string
  admissionDate: string
  patientAlias: string
  patientGender: 'L' | 'P'
  patientAge: number
  inacbgCode: string
  inacbgDescription: string
  hospitalId: string
  hospitalName: string
  facilityType: string
  doctorName: string
  fraudTypology: z.infer<typeof fraudTypologySchema>
  signalSummary: string
  tariffIdr: number
  riskScore: number
  riskZone: z.infer<typeof riskZoneSchema>
  status: z.infer<typeof claimStatusSchema>
}

export interface ClaimsQueueSummary {
  perluTelaahCount: number
  belumDicekCount: number
  klarifikasiCount: number
  selesaiCount: number
  readyClarifyCount: number
  fastTrackCount: number
  fastTrackAmountIdr: number
  activeQueueTotalTariffIdr: number
}

export interface HospitalOption {
  id: string
  name: string
  facilityType: string
}

export interface ClaimsQueueResponse {
  items: ClaimQueueItem[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    filteredTariffIdr: number
  }
  summary: ClaimsQueueSummary
  hospitals: HospitalOption[]
}

export const recordHospitalResponseInputSchema = z.object({
  claimId: z.string().min(1).max(64),
  responseNote: z
    .string()
    .trim()
    .min(5, 'Ringkasan balasan RS minimal 5 karakter')
    .max(1000),
})
export type RecordHospitalResponseInput = z.infer<
  typeof recordHospitalResponseInputSchema
>

export const generateClaimAiInputSchema = z.object({
  claimId: z.string().min(1).max(64),
  mode: z.enum(['all', 'narrative', 'draft']).default('all'),
  requiredDocs: z.array(z.string().max(120)).max(8).optional(),
  force: z.boolean().optional(),
})
export type GenerateClaimAiInput = z.infer<typeof generateClaimAiInputSchema>

export interface ClaimAuditEntry {
  id: string
  action: string
  fromStatus: string | null
  toStatus: string | null
  actorName: string
  actorRole: string
  note: string | null
  createdAtIso: string
}

export interface ClaimDetailNavigation {
  index: number
  total: number
  prevId: string | null
  nextId: string | null
}

export interface ClaimDetailItem {
  id: string
  noSep: string
  patientAlias: string
  patientNikMasked: string
  patientGender: 'L' | 'P'
  patientAge: number
  admissionDate: string
  dischargeDate: string
  losDays: number
  serviceType: 'rawat_inap' | 'rawat_jalan'
  careClass: number
  hospitalId: string
  hospitalName: string
  facilityType: string
  referringFacility: string
  doctorId: string
  doctorName: string
  doctorSpecialty: string
  icd10Primary: string
  inacbgCode: string
  inacbgDescription: string
  tariffIdr: number
  peerAvgTariffIdr: number
  hospitalRealCostIdr: number
  scoreMedical: number
  scoreStatistical: number
  scoreNetwork: number
  riskScore: number
  riskZone: z.infer<typeof riskZoneSchema>
  fraudTypology: z.infer<typeof fraudTypologySchema>
  signalSummary: string
  status: z.infer<typeof claimStatusSchema>
  slaDueAt: string
  clarificationRequestedAt: string | null
  hospitalResponseNote: string | null
  hospitalRespondedAt: string | null
  aiNarrativeCache: string | null
  aiDraftCache: string | null
  escalatedToPkjkn: boolean
  decisionNote: string | null
  revisedTariffIdr: number | null
}

export interface ClaimDetailResponse {
  claim: ClaimDetailItem
  auditLogs: ClaimAuditEntry[]
  navigation: ClaimDetailNavigation
}

export interface SubmitClaimDecisionResult {
  claimId: string
  status: z.infer<typeof claimStatusSchema>
  escalated: boolean
  clusterCode: string | null
  escalationReasons: string[]
}
