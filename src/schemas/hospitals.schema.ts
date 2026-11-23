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
  search: z.string().trim().max(64).optional(),
  page: z.coerce.number().int().min(1).max(50).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
})
export type HospitalsFilterInput = z.infer<typeof hospitalsFilterSchema>

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
