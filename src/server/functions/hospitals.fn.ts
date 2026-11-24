import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  bulkHospitalPolicyInputSchema,
  hospitalsFilterSchema,
  pksRecommendationInputSchema,
} from '#/schemas/hospitals.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import {
  bulkUpdateHospitalPolicy,
  getHospitalDetail,
  listHospitalsScorecard,
  savePksRecommendation,
} from '#/server/services/hospitals.service'

export const getHospitalsScorecardFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['kepala_cabang'])])
  .validator((data: unknown) => hospitalsFilterSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return listHospitalsScorecard(context.db, context.user.branchCode, data)
  })

export const bulkUpdateHospitalPolicyFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['kepala_cabang'])])
  .validator((data: unknown) => bulkHospitalPolicyInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return bulkUpdateHospitalPolicy(context.db, context.user, data)
  })

export const getHospitalDetailFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['kepala_cabang'])])
  .validator((data: unknown) =>
    z.object({ hospitalId: z.string().min(1).max(32) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    return getHospitalDetail(context.db, context.user.branchCode, data.hospitalId)
  })

export const savePksRecommendationFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['kepala_cabang'])])
  .validator((data: unknown) => pksRecommendationInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return savePksRecommendation(context.db, context.user, data)
  })
