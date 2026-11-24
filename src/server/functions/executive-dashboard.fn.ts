import { createServerFn } from '@tanstack/react-start'
import { executiveDashboardFilterSchema } from '#/schemas/hospitals.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import { getExecutiveDashboard } from '#/server/services/executive-dashboard.service'

export const getExecutiveDashboardFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['kepala_cabang'])])
  .validator((data: unknown) => executiveDashboardFilterSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return getExecutiveDashboard(context.db, context.user.branchCode, data)
  })
