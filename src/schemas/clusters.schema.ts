import { z } from 'zod'

export const clusterStageSchema = z.enum([
  'baru',
  'sidak_fisik',
  'tagih_tgr',
  'evaluasi_pks',
  'limpah_aph',
  'arsip_wajar',
])

export const clusterFinalStatusSchema = z.enum([
  'belum_final',
  'tagih_tgr',
  'kirim_pak_rudi',
  'proses_aph',
  'arsip_wajar',
])

export const clustersFilterSchema = z.object({
  branchCode: z.string().max(24).optional(),
  stage: clusterStageSchema.optional(),
  search: z.string().trim().max(64).optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})
export type ClustersFilterInput = z.infer<typeof clustersFilterSchema>

export const clusterFinalizeInputSchema = z.object({
  clusterId: z.string().min(1).max(64),
  followupStage: clusterStageSchema,
  finalStatus: clusterFinalStatusSchema,
  agreedTgrIdr: z.number().int().nonnegative().max(100_000_000_000),
  checklist: z.object({
    cctvChecked: z.boolean(),
    registerMatched: z.boolean(),
    bapSigned: z.boolean(),
  }),
  auditResultNote: z
    .string()
    .trim()
    .min(5, 'Catatan hasil audit minimal 5 karakter')
    .max(1500),
})
export type ClusterFinalizeInput = z.infer<typeof clusterFinalizeInputSchema>

export const regionalDashboardFilterSchema = z.object({
  period: z.enum(['all', '2026-11', '2026-09']).default('all'),
  branchCode: z.string().max(24).optional(),
  search: z.string().trim().max(64).optional(),
})
export type RegionalDashboardFilterInput = z.infer<
  typeof regionalDashboardFilterSchema
>

export interface RegionalTrendPoint {
  label: string
  claimsCount: number
  amountIdr: number
  highlight?: boolean
}

export interface RegionalDashboardMetrics {
  totalClusters: number
  totalEscalatedClaims: number
  totalPotentialLossIdr: number
  criticalCount: number
  attentionCount: number
  criticalPotentialLossIdr: number
  collusionRepeatCount: number
  borUpcodingCount: number
  readySidakCount: number
  tgrMonitoringCount: number
  trend: RegionalTrendPoint[]
}

export interface RegionalClusterItem {
  id: string
  clusterCode: string
  title: string
  branchCode: string
  branchName: string
  hospitalId: string
  hospitalName: string
  doctorName: string | null
  riskScore: number
  priorityLevel: 'kritis' | 'perhatian'
  fraudTypology: string
  escalatedClaimCount: number
  potentialLossIdr: number
  followupStage: z.infer<typeof clusterStageSchema>
  summaryNote: string
}

export interface BranchEscalationSummary {
  branchCode: string
  branchName: string
  hospitalCountLabel: string
  dominantSummary: string
  clusterCount: number
  criticalCount: number
}

export interface RegionalDashboardResponse {
  metrics: RegionalDashboardMetrics
  clusters: RegionalClusterItem[]
  branches: BranchEscalationSummary[]
}

export const graphNodeKeySchema = z.enum([
  'referring_hospital',
  'clinic_practice',
  'dpjp_hub',
  'billing_hospital',
  'sep_cluster',
])
export type GraphNodeKey = z.infer<typeof graphNodeKeySchema>

export const investigationSearchSchema = z.object({
  clusterId: z.string().max(64).optional(),
  branchCode: z.string().max(24).optional(),
})
export type InvestigationSearchInput = z.infer<
  typeof investigationSearchSchema
>

export const updateClusterStageInputSchema = z.object({
  clusterId: z.string().min(1).max(64),
  followupStage: clusterStageSchema,
  note: z
    .string()
    .trim()
    .min(5, 'Catatan tindak lanjut minimal 5 karakter')
    .max(1500),
})
export type UpdateClusterStageInput = z.infer<
  typeof updateClusterStageInputSchema
>

export interface InvestigationClusterOption {
  id: string
  clusterCode: string
  title: string
  branchCode: string
  branchName: string
  hospitalName: string
  riskScore: number
  priorityLevel: 'kritis' | 'perhatian'
  followupStage: z.infer<typeof clusterStageSchema>
  potentialLossIdr: number
  escalatedClaimCount: number
}

export interface InvestigationBranchOption {
  branchCode: string
  branchName: string
  clusterCount: number
}

export interface InvestigationClaimSample {
  id: string
  noSep: string
  patientAlias: string
  admissionDate: string
  dischargeDate: string
  inacbgCode: string
  inacbgDescription: string
  referringFacility: string
  tariffIdr: number
  riskScore: number
  status: string
}

export interface ConstellationNodeDoc {
  id: string
  title: string
  subtitle: string
  actionType: 'copy' | 'print' | 'csv'
  docType?: 'dpjp_schedule' | 'sidak_checklist' | 'sep_bundle' | 'referring_summary'
}

export interface ConstellationNodeInfo {
  key: GraphNodeKey
  overline: string
  badgeLabel: string
  badgeTone: 'high' | 'medium' | 'primary'
  title: string
  subtitle: string
  canvasTag: string
  canvasTitle: string
  canvasMeta: string
  inboundText: string
  outboundText: string
  findingText: string
  documents: ConstellationNodeDoc[]
}

export interface ClusterStoryCard {
  step: string
  title: string
  description: string
  tone: 'primary' | 'high' | 'medium'
}

export interface ClusterInvestigationDetail {
  id: string
  clusterCode: string
  title: string
  branchCode: string
  branchName: string
  hospitalId: string
  hospitalName: string
  facilityType: string
  borTotalPct: number
  borCardioVipPct: number
  bedCapacity: number
  doctorName: string
  doctorSpecialty: string
  practiceFacilityCount: number
  riskScore: number
  priorityLevel: 'kritis' | 'perhatian'
  fraudTypology: string
  escalatedClaimCount: number
  potentialLossIdr: number
  followupStage: z.infer<typeof clusterStageSchema>
  auditResultNote: string | null
  edgeLabels: {
    referToHub: string
    hubToBilling: string
    billingToCluster: string
    circularReturn: string
  }
  nodes: Record<GraphNodeKey, ConstellationNodeInfo>
  storyCards: ClusterStoryCard[]
  claimSamples: InvestigationClaimSample[]
}

export interface ClusterInvestigationResponse {
  activeCluster: ClusterInvestigationDetail | null
  clusterOptions: InvestigationClusterOption[]
  branches: InvestigationBranchOption[]
  allClusters: InvestigationClusterOption[]
}

export interface UpdateClusterStageResult {
  clusterId: string
  clusterCode: string
  followupStage: z.infer<typeof clusterStageSchema>
  finalStatus: z.infer<typeof clusterFinalStatusSchema>
}

export const followupTabSchema = z.enum(['semua', 'menunggu', 'selesai'])

export const clusterFollowupFilterSchema = z.object({
  tab: followupTabSchema.default('semua'),
  period: z.enum(['all', '2026-11', '2026-09']).default('all'),
  branchCode: z.string().max(24).optional(),
  stage: clusterStageSchema.optional(),
  onlyPendingField: z.coerce.boolean().optional(),
  search: z.string().trim().max(64).optional(),
  clusterId: z.string().max(64).optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
export type ClusterFollowupFilterInput = z.infer<
  typeof clusterFollowupFilterSchema
>

export interface ClusterFieldChecklist {
  cctvChecked: boolean
  registerMatched: boolean
  bapSigned: boolean
}

export interface ClusterFollowupItem {
  id: string
  clusterCode: string
  title: string
  branchCode: string
  branchName: string
  hospitalId: string
  hospitalName: string
  fraudTypology: string
  riskScore: number
  escalatedClaimCount: number
  potentialLossIdr: number
  agreedTgrIdr: number
  followupStage: z.infer<typeof clusterStageSchema>
  finalStatus: z.infer<typeof clusterFinalStatusSchema>
  isPendingField: boolean
  checklist: ClusterFieldChecklist
  initialInstruction: string
  auditResultNote: string | null
  eventDateIso: string
}

export interface ClusterFollowupSummary {
  totalCount: number
  pendingFieldCount: number
  finalizedCount: number
  totalTgrIdr: number
  tgrHospitalCount: number
  pksHospitalCount: number
  archivedCount: number
}

export interface ClusterFollowupResponse {
  items: ClusterFollowupItem[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  summary: ClusterFollowupSummary
  branches: InvestigationBranchOption[]
}

export interface FinalizeClusterResult {
  clusterId: string
  clusterCode: string
  hospitalName: string
  followupStage: z.infer<typeof clusterStageSchema>
  finalStatus: z.infer<typeof clusterFinalStatusSchema>
  agreedTgrIdr: number
}
