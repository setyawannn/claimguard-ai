import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseAppError } from '#/lib/route-guards'
import { CLUSTER_STAGE_META } from '#/lib/status-tokens'
import type {
  ClusterFinalizeInput,
  ClusterFollowupFilterInput,
  InvestigationSearchInput,
  RegionalDashboardFilterInput,
  UpdateClusterStageInput,
} from '#/schemas/clusters.schema'
import {
  finalizeClusterAuditFn,
  getClusterFollowupFn,
} from '#/server/functions/cluster-followup.fn'
import {
  getClusterInvestigationFn,
  updateClusterStageFn,
} from '#/server/functions/cluster-investigation.fn'
import { getRegionalDashboardFn } from '#/server/functions/regional-dashboard.fn'
import { queryKeys } from './keys'

export const regionalDashboardQueryOptions = (
  filters: RegionalDashboardFilterInput,
) =>
  queryOptions({
    queryKey: queryKeys.clusters.dashboard(filters),
    queryFn: () => getRegionalDashboardFn({ data: filters }),
    staleTime: 20_000,
  })

export const clusterInvestigationQueryOptions = (
  params: InvestigationSearchInput,
) =>
  queryOptions({
    queryKey: queryKeys.clusters.investigation(params),
    queryFn: () => getClusterInvestigationFn({ data: params }),
    staleTime: 20_000,
  })

export const clusterFollowupQueryOptions = (
  filters: ClusterFollowupFilterInput,
) =>
  queryOptions({
    queryKey: queryKeys.clusters.followup(filters),
    queryFn: () => getClusterFollowupFn({ data: filters }),
    staleTime: 20_000,
  })

export function useUpdateClusterStageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateClusterStageInput) =>
      updateClusterStageFn({ data: input }),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clusters.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.all }),
      ])
      const label = CLUSTER_STAGE_META[res.followupStage].label
      toast.success(
        `Status tindak lanjut kluster ${res.clusterCode} ditetapkan ke '${label}' & tercatat di Audit Log.`,
      )
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}

export function useFinalizeClusterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ClusterFinalizeInput) =>
      finalizeClusterAuditFn({ data: input }),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clusters.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pks.all }),
      ])
      toast.success(
        `Hasil audit ${res.clusterCode} (${res.hospitalName}) berhasil disimpan & disinkronkan ke Audit Log.`,
      )
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}
