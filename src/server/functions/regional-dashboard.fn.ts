import { createServerFn } from '@tanstack/react-start'
import { regionalDashboardFilterSchema } from '#/schemas/clusters.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import { getRegionalDashboard } from '#/server/services/regional-dashboard.service'

export const getRegionalDashboardFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['auditor_wilayah'])])
  .validator((data: unknown) => regionalDashboardFilterSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return getRegionalDashboard(context.db, data)
  })
