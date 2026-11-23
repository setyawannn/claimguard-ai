import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { parseAppError, sanitizeRedirectPath } from '#/lib/route-guards'
import type { LoginInput } from '#/schemas/session.schema'
import { getSessionFn, loginFn, logoutFn } from '#/server/functions/session.fn'
import { queryKeys } from './keys'

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.session.current(),
    queryFn: () => getSessionFn(),
    staleTime: 60_000,
  })

export function useLoginMutation(redirectTo?: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (input: LoginInput) => loginFn({ data: input }),
    onSuccess: async (user) => {
      queryClient.setQueryData(queryKeys.session.current(), user)
      toast.success(`Selamat datang, ${user.name}`)

      const target = sanitizeRedirectPath(redirectTo)
      const url = new URL(target, 'http://localhost')
      await router.navigate({
        to: url.pathname as '/',
        search: Object.fromEntries(url.searchParams) as never,
        replace: true,
      })
      await router.invalidate()
    },
    onError: (error) => {
      toast.error(parseAppError(error).message)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const finishLogout = async () => {
    queryClient.setQueryData(queryKeys.session.current(), null)
    queryClient.clear()
    await router.navigate({ to: '/login', replace: true })
  }

  return useMutation({
    mutationFn: () => logoutFn(),
    onSuccess: async () => {
      await finishLogout()
      toast.success('Anda telah keluar dari ClaimGuard')
    },
    onError: async (error) => {
      await finishLogout()
      const parsed = parseAppError(error)
      if (parsed.code === 'UNAUTHORIZED') {
        toast.info('Sesi telah berakhir. Silakan masuk kembali.')
        return
      }
      toast.error(parsed.message)
    },
  })
}
