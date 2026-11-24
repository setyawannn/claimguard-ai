import { z } from 'zod'

export const pksPolicySchema = z.enum([
  'pks_bersyarat',
  'teguran_sp1',
  'pembinaan',
  'perpanjang',
])

export const hospitalsFilterSchema = z.object({
  tab: z
    .enum(['semua', 'evaluasi_pks', 'pantau', 'mitra_patuh'])
    .default('semua'),
  pksStatus: z
    .enum([
      'aktif',
      'evaluasi_pks',
      'pks_bersyarat',
      'teguran_sp1',
      'pembinaan',
      'diperpanjang',
    ])
    .optional(),
  facilityType: z.enum(['A', 'B', 'C', 'D', 'Klinik']).optional(),
  sort: z
    .enum(['score_asc', 'score_desc', 'tgr_desc', 'bor_desc'])
    .default('score_asc'),
  search: z.string().trim().max(64).optional(),
  page: z.coerce.number().int().min(1).max(50).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(6),
})
export type HospitalsFilterInput = z.infer<typeof hospitalsFilterSchema>

export const bulkHospitalPolicyInputSchema = z.object({
  hospitalIds: z.array(z.string().min(1).max(32)).min(1).max(20),
  action: z.enum(['pembinaan', 'diperpanjang']),
  note: z.string().trim().min(5, 'Catatan keputusan minimal 5 karakter').max(500),
})
export type BulkHospitalPolicyInput = z.infer<
  typeof bulkHospitalPolicyInputSchema
>

export const pksRecommendationInputSchema = z.object({
  hospitalId: z.string().min(1).max(32),
  recommendedPolicy: pksPolicySchema,
  addendumRequirements: z.array(z.string().trim().min(1).max(200)).max(10),
  executiveNote: z.string().trim().min(5).max(1500),
})
export type PksRecommendationInput = z.infer<
  typeof pksRecommendationInputSchema
>

export const pksLockInputSchema = z.object({
  decisionId: z.string().min(1).max(64),
  finalPolicy: z.string().trim().min(2).max(100),
  eofficeRefNumber: z
    .string()
    .trim()
    .min(4, 'Nomor surat e-Office wajib diisi')
    .max(100),
  meetingChecklist: z.object({
    baSigned: z.boolean(),
    tgrCommitmentReceived: z.boolean(),
    eofficeRecorded: z.boolean(),
  }),
  executiveNote: z.string().trim().min(5).max(1500),
})
export type PksLockInput = z.infer<typeof pksLockInputSchema>

export function safeParseJson<T>(
  raw: string | null | undefined,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (!raw) return fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    return result.success ? result.data : fallback
  } catch {
    return fallback
  }
}

export const executiveDashboardFilterSchema = z.object({
  period: z.enum(['all', '2026-11', '2026-10']).default('all'),
  hospitalId: z.string().max(32).optional(),
  search: z.string().trim().max(64).optional(),
})
export type ExecutiveDashboardFilterInput = z.infer<
  typeof executiveDashboardFilterSchema
>

export interface ExecutiveTrendPoint {
  label: string
  claimsCount: number
  amountIdr: number
  highlight?: boolean
}

export interface ExecutiveHospitalScoreItem {
  id: string
  code: string
  name: string
  facilityType: string
  complianceScore: number
  complianceGrade: 'A' | 'B' | 'C' | 'D'
  borTotalPct: number
  borCardioVipPct: number
  pilarFastTrackPct: number
  tgrBurdenIdr: number
  pksExpiresAt: string
  pksStatus: string
  dominantTypology: string
}

export interface ExecutiveTypologySummary {
  key: string
  title: string
  caseCount: number
  percentShare: number
  amountIdr: number
  subtitle: string
  zone: 'merah' | 'kuning' | 'hijau'
}

export interface ExecutiveDashboardMetrics {
  totalHospitals: number
  fundsSecuredIdr: number
  costAvoidanceIdr: number
  totalTgrIdr: number
  needEvaluationCount: number
  sp1AndEvaluasiCount: number
  pembinaanCount: number
  repeatPhantomPct: number
  upcodingUnbundlingPct: number
  fastTrackPct: number
  fastTrackCount: number
  slaPct: number
  trend: ExecutiveTrendPoint[]
}

export interface ExecutiveDashboardResponse {
  metrics: ExecutiveDashboardMetrics
  hospitals: ExecutiveHospitalScoreItem[]
  priorityHospitals: ExecutiveHospitalScoreItem[]
  typologies: ExecutiveTypologySummary[]
}

export interface HospitalScorecardItem {
  id: string
  code: string
  name: string
  facilityType: 'A' | 'B' | 'C' | 'D' | 'Klinik'
  directorName: string
  bedCapacity: number
  borTotalPct: number
  borCardioVipPct: number
  complianceScore: number
  complianceGrade: 'A' | 'B' | 'C' | 'D'
  pilarFastTrackPct: number
  tgrBurdenIdr: number
  pksExpiresAt: string
  pksStatus:
    | 'aktif'
    | 'evaluasi_pks'
    | 'pks_bersyarat'
    | 'teguran_sp1'
    | 'pembinaan'
    | 'diperpanjang'
  dominantTypology: string
}

export interface HospitalsScorecardSummary {
  totalCount: number
  evaluasiPksCount: number
  pantauCount: number
  mitraPatuhCount: number
  avgComplianceScore: number
  avgGradeLabel: string
}

export interface HospitalsScorecardResponse {
  items: HospitalScorecardItem[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  summary: HospitalsScorecardSummary
}

export interface BulkHospitalPolicyResult {
  updatedCount: number
  action: 'pembinaan' | 'diperpanjang'
}

export interface HospitalDetailClusterInfo {
  id: string
  clusterCode: string
  fraudTypology: string
  escalatedClaimCount: number
  potentialLossIdr: number
  agreedTgrIdr: number
  followupStage: string
  finalStatus: string
  auditResultNote: string | null
  doctorName: string | null
}

export interface HospitalDetailPksInfo {
  id: string
  recommendedPolicy: z.infer<typeof pksPolicySchema>
  finalPolicy: string | null
  tgrCommitmentIdr: number
  addendumRequirements: string[]
  eofficeRefNumber: string | null
  executiveNote: string | null
  isLocked: boolean
}

export interface HospitalDetailNavigation {
  index: number
  total: number
  prevId: string | null
  prevName: string | null
  nextId: string | null
  nextName: string | null
}

export interface HospitalDetailItem extends HospitalScorecardItem {
  pilarBorScore: number
  pilarCodingScore: number
  pilarResponseScore: number
  pksEofficeNumber: string | null
  monthlyClaimAvg: number
  cluster: HospitalDetailClusterInfo | null
  pksDraft: HospitalDetailPksInfo | null
}

export interface HospitalDetailResponse {
  hospital: HospitalDetailItem
  navigation: HospitalDetailNavigation
}

export interface SavePksRecommendationResult {
  decisionId: string
  hospitalId: string
  recommendedPolicy: z.infer<typeof pksPolicySchema>
  pksStatus: HospitalScorecardItem['pksStatus']
}

export const pksDecisionsFilterSchema = z.object({
  tab: z.enum(['semua', 'menunggu_rapat', 'final']).default('semua'),
  policyPath: z
    .enum(['all', 'pks_bersyarat', 'teguran_sp1', 'pembinaan', 'perpanjang'])
    .default('all'),
  search: z.string().trim().max(64).optional(),
  onlyWaiting: z.coerce.boolean().default(false),
  selectedId: z.string().max(64).optional(),
})
export type PksDecisionsFilterInput = z.infer<typeof pksDecisionsFilterSchema>

export interface PksMeetingChecklist {
  baSigned: boolean
  tgrCommitmentReceived: boolean
  eofficeRecorded: boolean
}

export interface PksDecisionRowItem {
  decisionId: string
  hospitalId: string
  hospitalCode: string
  hospitalName: string
  facilityType: HospitalScorecardItem['facilityType']
  pksExpiresAt: string
  complianceScore: number
  complianceGrade: HospitalScorecardItem['complianceGrade']
  tgrBurdenIdr: number
  pksStatus: HospitalScorecardItem['pksStatus']
  recommendedPolicy: z.infer<typeof pksPolicySchema>
  finalPolicy: string | null
  tgrCommitmentIdr: number
  addendumRequirements: string[]
  meetingChecklist: PksMeetingChecklist
  eofficeRefNumber: string | null
  executiveNote: string | null
  isLocked: boolean
  lockedAt: string | null
}

export interface PksDecisionsSummary {
  totalCount: number
  waitingMeetingCount: number
  finalCount: number
  conditionalAndSp1Count: number
  totalTgrCommitmentIdr: number
  extendedPatuhCount: number
}

export interface PksDecisionsResponse {
  items: PksDecisionRowItem[]
  summary: PksDecisionsSummary
  auditTrailCount: number
}

export interface LockPksDecisionResult {
  decisionId: string
  hospitalId: string
  finalPolicy: string
  eofficeRefNumber: string
  lockedAt: string
}
