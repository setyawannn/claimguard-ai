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
