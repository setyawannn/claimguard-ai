import { createServerFn } from '@tanstack/react-start'
import { claimsHistoryFilterSchema } from '#/schemas/claims.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import { listClaimsHistory } from '#/server/services/claims-history.service'

export const getClaimsHistoryFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['verifikator'])])
  .validator((data: unknown) => claimsHistoryFilterSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return listClaimsHistory(context.db, context.user.branchCode, data)
  })
