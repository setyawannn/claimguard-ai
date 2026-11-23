import { createServerFn } from '@tanstack/react-start'
import {
  approveFastTrackInputSchema,
  bulkClaimActionInputSchema,
  claimsFilterSchema,
} from '#/schemas/claims.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import {
  approveFastTrackClaims,
  bulkUpdateClaims,
  listClaimsQueue,
} from '#/server/services/claims.service'

export const getClaimsQueueFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['verifikator'])])
  .validator((data: unknown) => claimsFilterSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return listClaimsQueue(context.db, context.user.branchCode, data)
  })

export const bulkUpdateClaimsFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['verifikator'])])
  .validator((data: unknown) => bulkClaimActionInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return bulkUpdateClaims(context.db, context.user, data)
  })

export const approveFastTrackClaimsFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['verifikator'])])
  .validator((data: unknown) => approveFastTrackInputSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return approveFastTrackClaims(context.db, context.user, data.note)
  })
