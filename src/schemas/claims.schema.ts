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
  limit: z.coerce.number().int().min(1).max(100).default(25),
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
  note: z.string().trim().min(3).max(500),
})
export type BulkClaimActionInput = z.infer<typeof bulkClaimActionInputSchema>
