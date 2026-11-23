import { createFileRoute } from '@tanstack/react-router'
import { requireRouteAuth } from '#/lib/route-guards'
import { DashboardPage } from '#/pages/dashboard/DashboardPage'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context, location }) => {
    const user = await requireRouteAuth({ context, location })
    return { user }
  },
  component: HomeRoute,
})

function HomeRoute() {
  const { user } = Route.useRouteContext()
  return <DashboardPage user={user} />
}
