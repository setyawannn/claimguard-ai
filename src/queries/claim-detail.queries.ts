import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseAppError } from '#/lib/route-guards'
import { CLAIM_STATUS_META } from '#/lib/status-tokens'
import type {
  ClaimDecisionInput,
  GenerateClaimAiInput,
  RecordHospitalResponseInput,
} from '#/schemas/claims.schema'
import {
  generateClaimAiCopilotFn,
  getClaimDetailFn,
  recordHospitalResponseFn,
  submitClaimDecisionFn,
} from '#/server/functions/claim-detail.fn'
import { queryKeys } from './keys'

export const claimDetailQueryOptions = (claimId: string) =>
  queryOptions({
    queryKey: queryKeys.claims.detail(claimId),
    queryFn: () => getClaimDetailFn({ data: { claimId } }),
    staleTime: 20_000,
  })

export function useSubmitClaimDecisionMutation(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ClaimDecisionInput) =>
      submitClaimDecisionFn({ data: input }),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.claims.detail(claimId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.claims.all }),
      ])

      const label = CLAIM_STATUS_META[res.status].label
      if (res.escalated && res.clusterCode) {
        toast.warning(
          `Klaim ${label} & otomatis dieskalasi ke kluster ${res.clusterCode} (${res.escalationReasons[0] ?? 'Trigger PK-JKN'}).`,
        )
        return
      }
      toast.success(`Keputusan '${label}' disimpan & tercatat ke Audit Log.`)
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}

export function useRecordHospitalResponseMutation(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RecordHospitalResponseInput) =>
      recordHospitalResponseFn({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.claims.detail(claimId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.claims.all }),
      ])
      toast.success('Balasan konfirmasi RS dicatat · berkas siap diputuskan.')
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}

export function useGenerateClaimAiMutation(claimId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: GenerateClaimAiInput) =>
      generateClaimAiCopilotFn({ data: input }),
    onSuccess: async (res, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.claims.detail(claimId),
      })
      if (variables.force) {
        toast.success(
          res.source === 'gemini'
            ? 'Analisis AI & draf klarifikasi diperbarui via Gemini dan disimpan ke DB.'
            : 'Analisis klinis & draf klarifikasi diperbarui dan disimpan ke DB.',
        )
      }
    },
    onError: (error, variables) => {
      if (variables.force) {
        toast.error(parseAppError(error).message)
      }
    },
  })
}
