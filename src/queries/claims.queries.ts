import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatIdrCompact } from '#/lib/format'
import { parseAppError } from '#/lib/route-guards'
import type {
  ApproveFastTrackInput,
  BulkClaimActionInput,
  ClaimsFilterInput,
} from '#/schemas/claims.schema'
import {
  approveFastTrackClaimsFn,
  bulkUpdateClaimsFn,
  getClaimsQueueFn,
} from '#/server/functions/claims.fn'
import { queryKeys } from './keys'

export const claimsQueueQueryOptions = (filters: ClaimsFilterInput) =>
  queryOptions({
    queryKey: queryKeys.claims.list(filters),
    queryFn: () => getClaimsQueueFn({ data: filters }),
    staleTime: 20_000,
  })

export function useBulkClaimActionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BulkClaimActionInput) =>
      bulkUpdateClaimsFn({ data: input }),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.claims.all })
      const actionText =
        res.action === 'disetujui' ? 'disetujui untuk pencairan' : 'dikirim ke status Klarifikasi RS'
      toast.success(
        `${res.updatedCount} berkas (${formatIdrCompact(res.totalAmountIdr)}) berhasil ${actionText}.`,
      )
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}

export function useApproveFastTrackMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input?: ApproveFastTrackInput) =>
      approveFastTrackClaimsFn({ data: input }),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.claims.all })
      toast.success(
        `${res.updatedCount} klaim Fast-Track (${formatIdrCompact(res.totalAmountIdr)}) disetujui & dicatat ke Audit Log.`,
      )
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}
