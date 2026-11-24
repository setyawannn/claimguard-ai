import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { parseAppError } from '#/lib/route-guards'
import type {
  BulkHospitalPolicyInput,
  ExecutiveDashboardFilterInput,
  HospitalsFilterInput,
  PksDecisionsFilterInput,
  PksLockInput,
  PksRecommendationInput,
} from '#/schemas/hospitals.schema'
import { getExecutiveDashboardFn } from '#/server/functions/executive-dashboard.fn'
import {
  bulkUpdateHospitalPolicyFn,
  getHospitalDetailFn,
  getHospitalsScorecardFn,
  savePksRecommendationFn,
} from '#/server/functions/hospitals.fn'
import { getPksDecisionsFn, lockPksDecisionFn } from '#/server/functions/pks.fn'
import { queryKeys } from './keys'

export const executiveDashboardQueryOptions = (
  filters: ExecutiveDashboardFilterInput,
) =>
  queryOptions({
    queryKey: queryKeys.hospitals.executiveDashboard(filters),
    queryFn: () => getExecutiveDashboardFn({ data: filters }),
    staleTime: 20_000,
  })

export const hospitalsScorecardQueryOptions = (filters: HospitalsFilterInput) =>
  queryOptions({
    queryKey: queryKeys.hospitals.list(filters),
    queryFn: () => getHospitalsScorecardFn({ data: filters }),
    staleTime: 20_000,
  })

export const hospitalDetailQueryOptions = (hospitalId: string) =>
  queryOptions({
    queryKey: queryKeys.hospitals.detail(hospitalId),
    queryFn: () => getHospitalDetailFn({ data: { hospitalId } }),
    staleTime: 20_000,
  })

export function useBulkHospitalPolicyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: BulkHospitalPolicyInput) =>
      bulkUpdateHospitalPolicyFn({ data: input }),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pks.all }),
      ])
      const label =
        res.action === 'diperpanjang'
          ? 'disetujui untuk Perpanjang PKS'
          : 'ditetapkan ke Pembinaan & Audit'
      toast.success(
        `${res.updatedCount} FKRTL mitra berhasil ${label} & tercatat di Audit Log.`,
      )
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}

export function useSavePksRecommendationMutation(hospitalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PksRecommendationInput) =>
      savePksRecommendationFn({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.hospitals.detail(hospitalId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pks.all }),
      ])
      toast.success(
        'Rekomendasi kebijakan PKS & bahan rapat berhasil disimpan ke Audit Log.',
      )
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}

export const pksDecisionsQueryOptions = (filters: PksDecisionsFilterInput) =>
  queryOptions({
    queryKey: queryKeys.pks.list(filters),
    queryFn: () => getPksDecisionsFn({ data: filters }),
    staleTime: 20_000,
  })

export function useLockPksDecisionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PksLockInput) => lockPksDecisionFn({ data: input }),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pks.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.all }),
      ])
      toast.success(
        `Keputusan "${res.finalPolicy}" (${res.eofficeRefNumber}) berhasil dikunci di Audit Log.`,
      )
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}
