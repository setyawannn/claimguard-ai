import { createFileRoute, notFound } from '@tanstack/react-router'
import { requireRouteRole } from '#/lib/route-guards'
import { ClaimDetailPage } from '#/pages/verifikator/ClaimDetailPage'
import { claimDetailQueryOptions } from '#/queries/claim-detail.queries'

export const Route = createFileRoute('/antrean/$claimId')({
  beforeLoad: async ({ context, location }) => {
    const user = await requireRouteRole({ context, location }, ['verifikator'])
    return { user }
  },
  loader: async ({ context, params }) => {
    const detail = await context.queryClient.ensureQueryData(
      claimDetailQueryOptions(params.claimId),
    )
    if (!detail) {
      throw notFound()
    }
  },
  head: ({ params }) => ({
    meta: [{ title: `Pemeriksaan Klaim #${params.claimId} · ClaimGuard AI` }],
  }),
  component: ClaimDetailRoute,
})

function ClaimDetailRoute() {
  const { claimId } = Route.useParams()
  const { user } = Route.useRouteContext()
  return <ClaimDetailPage claimId={claimId} verifikatorName={user.name} />
}
