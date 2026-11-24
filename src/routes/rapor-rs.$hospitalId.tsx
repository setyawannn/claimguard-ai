import { createFileRoute } from '@tanstack/react-router'
import { requireRouteRole } from '#/lib/route-guards'
import { RaporRsDetailPage } from '#/pages/executive/RaporRsDetailPage'
import { hospitalDetailQueryOptions } from '#/queries/hospitals.queries'

export const Route = createFileRoute('/rapor-rs/$hospitalId')({
  beforeLoad: async ({ context, location }) => {
    await requireRouteRole({ context, location }, ['kepala_cabang'])
  },
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      hospitalDetailQueryOptions(params.hospitalId),
    )
  },
  head: () => ({
    meta: [{ title: 'Detail Rapor & Kontrak PKS · ClaimGuard AI' }],
  }),
  component: RaporRsDetailRoute,
})

function RaporRsDetailRoute() {
  const { hospitalId } = Route.useParams()
  return <RaporRsDetailPage hospitalId={hospitalId} />
}
