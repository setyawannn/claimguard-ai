import { createFileRoute, redirect } from '@tanstack/react-router'
import { sanitizeRedirectPath } from '#/lib/route-guards'
import { LoginPage } from '#/pages/auth/LoginPage'
import { sessionQueryOptions } from '#/queries/session.queries'

interface LoginSearch {
  redirect?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions())
    if (user) {
      const target = sanitizeRedirectPath(search.redirect)
      const url = new URL(target, 'http://localhost')
      throw redirect({
        to: url.pathname as '/',
        search: Object.fromEntries(url.searchParams) as never,
      })
    }
  },
  head: () => ({
    meta: [{ title: 'Masuk · ClaimGuard AI' }],
  }),
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect: redirectTo } = Route.useSearch()
  return <LoginPage redirectTo={redirectTo} />
}
