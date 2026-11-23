import { createServerFn } from '@tanstack/react-start'
import {
  clusterFinalizeInputSchema,
  clusterFollowupFilterSchema,
} from '#/schemas/clusters.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import {
  finalizeClusterAudit,
  listClusterFollowups,
} from '#/server/services/cluster-followup.service'

export const getClusterFollowupFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['auditor_wilayah'])])
  .validator((data: unknown) => clusterFollowupFilterSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return listClusterFollowups(context.db, data)
  })

export const finalizeClusterAuditFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['auditor_wilayah'])])
  .validator((data: unknown) => clusterFinalizeInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return finalizeClusterAudit(context.db, context.user, data)
  })
