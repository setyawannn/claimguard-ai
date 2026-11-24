import { createServerFn } from '@tanstack/react-start'
import {
  pksDecisionsFilterSchema,
  pksLockInputSchema,
} from '#/schemas/hospitals.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import { listPksDecisions, lockPksDecision } from '#/server/services/pks.service'

export const getPksDecisionsFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['kepala_cabang'])])
  .validator((data: unknown) => pksDecisionsFilterSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return listPksDecisions(context.db, context.user.branchCode, data)
  })

export const lockPksDecisionFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['kepala_cabang'])])
  .validator((data: unknown) => pksLockInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return lockPksDecision(context.db, context.user, data)
  })
