import { queryOptions } from '@tanstack/react-query'
import type { ClaimsHistoryFilterInput } from '#/schemas/claims.schema'
import { getClaimsHistoryFn } from '#/server/functions/claims-history.fn'
import { queryKeys } from './keys'

export const claimsHistoryQueryOptions = (filters: ClaimsHistoryFilterInput) =>
  queryOptions({
    queryKey: queryKeys.claims.history(filters),
    queryFn: () => getClaimsHistoryFn({ data: filters }),
    staleTime: 20_000,
  })
