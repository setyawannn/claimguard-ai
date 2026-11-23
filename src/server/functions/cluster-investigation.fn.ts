import { createServerFn } from '@tanstack/react-start'
import {
  investigationSearchSchema,
  updateClusterStageInputSchema,
} from '#/schemas/clusters.schema'
import { requireRoleMiddleware } from '#/server/middleware/auth.middleware'
import {
  getClusterInvestigation,
  updateClusterStage,
} from '#/server/services/cluster-investigation.service'

export const getClusterInvestigationFn = createServerFn({ method: 'GET' })
  .middleware([requireRoleMiddleware(['auditor_wilayah'])])
  .validator((data: unknown) => investigationSearchSchema.parse(data ?? {}))
  .handler(async ({ context, data }) => {
    return getClusterInvestigation(context.db, data)
  })

export const updateClusterStageFn = createServerFn({ method: 'POST' })
  .middleware([requireRoleMiddleware(['auditor_wilayah'])])
  .validator((data: unknown) => updateClusterStageInputSchema.parse(data))
  .handler(async ({ context, data }) => {
    return updateClusterStage(context.db, context.user, data)
  })
