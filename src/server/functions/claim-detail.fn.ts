import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  claimDecisionInputSchema,
  generateClaimAiInputSchema,
  recordHospitalResponseInputSchema,
} from '#/schemas/claims.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import {
  generateClaimAiCopilot,
  getClaimDetail,
  recordHospitalResponse,
  submitClaimDecision,
} from '#/server/services/claim-detail.service'

export const getClaimDetailFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['verifikator'])])
  .validator((data: unknown) =>
    z.object({ claimId: z.string().min(1).max(64) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    return getClaimDetail(context.db, context.user.branchCode, data.claimId)
  })

export const submitClaimDecisionFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['verifikator'])])
  .validator((data: unknown) => claimDecisionInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return submitClaimDecision(context.db, context.user, data)
  })

export const recordHospitalResponseFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['verifikator'])])
  .validator((data: unknown) => recordHospitalResponseInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return recordHospitalResponse(context.db, context.user, data)
  })

export const generateClaimAiCopilotFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['verifikator'])])
  .validator((data: unknown) => generateClaimAiInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return generateClaimAiCopilot(context.db, context.user, data)
  })
