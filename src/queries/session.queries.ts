import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { UserRole } from '#/schemas/session.schema'
import { getSessionFn, switchRoleFn } from '#/server/functions/session.fn'
import { queryKeys } from './keys'

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.session.current(),
    queryFn: () => getSessionFn(),
    staleTime: Infinity,
  })

export function useSwitchRoleMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (role: UserRole) => switchRoleFn({ data: { role } }),
    onSuccess: async (nextUser) => {
      queryClient.setQueryData(queryKeys.session.current(), nextUser)
      await router.navigate({ to: '/' })
      await router.invalidate()
    },
  })
}
