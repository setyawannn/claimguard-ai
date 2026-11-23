import { createFileRoute } from '@tanstack/react-router'
import { requireRouteAuth } from '#/lib/route-guards'
import { DashboardPage } from '#/pages/dashboard/DashboardPage'
import { RegionalDashboardPage } from '#/pages/regional/RegionalDashboardPage'
import { regionalDashboardQueryOptions } from '#/queries/clusters.queries'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context, location }) => {
    const user = await requireRouteAuth({ context, location })
    return { user }
  },
  loader: async ({ context }) => {
    if (context.user.role === 'auditor_wilayah') {
      await context.queryClient.ensureQueryData(
        regionalDashboardQueryOptions({ period: 'all' }),
      )
    }
  },
  component: HomeRoute,
})

function HomeRoute() {
  const { user } = Route.useRouteContext()
  if (user.role === 'auditor_wilayah') {
    return <RegionalDashboardPage user={user} />
  }
  return <DashboardPage user={user} />
}
