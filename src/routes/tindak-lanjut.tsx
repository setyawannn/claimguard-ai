import { createFileRoute } from '@tanstack/react-router'
import type { z } from 'zod'
import { requireRouteRole } from '#/lib/route-guards'
import { TindakLanjutPage } from '#/pages/regional/TindakLanjutPage'
import { clusterFollowupQueryOptions } from '#/queries/clusters.queries'
import { clusterFollowupFilterSchema } from '#/schemas/clusters.schema'
import type { ClusterFollowupFilterInput } from '#/schemas/clusters.schema'

type FollowupSearchParams = z.input<typeof clusterFollowupFilterSchema>

function toFilterInput(
  raw: FollowupSearchParams,
): ClusterFollowupFilterInput {
  const parsed = clusterFollowupFilterSchema.safeParse(raw)
  return parsed.success ? parsed.data : clusterFollowupFilterSchema.parse({})
}

export const Route = createFileRoute('/tindak-lanjut')({
  validateSearch: (search: Record<string, unknown>): FollowupSearchParams => {
    const parsed = clusterFollowupFilterSchema.partial().safeParse(search)
    return parsed.success ? parsed.data : {}
  },
  beforeLoad: async ({ context, location }) => {
    await requireRouteRole({ context, location }, ['auditor_wilayah'])
  },
  loaderDeps: ({ search }) => toFilterInput(search),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      clusterFollowupQueryOptions(deps),
    )
  },
  head: () => ({
    meta: [{ title: 'Tindak Lanjut & Rekap Wilayah · ClaimGuard AI' }],
  }),
  component: TindakLanjutRoute,
})

function TindakLanjutRoute() {
  const rawSearch = Route.useSearch()
  const filters = toFilterInput(rawSearch)
  const navigate = Route.useNavigate()

  const handleFiltersChange = (
    patch: Partial<ClusterFollowupFilterInput>,
  ) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
    })
  }

  const handleResetFilters = () => {
    void navigate({
      search: filters.tab === 'semua' ? {} : { tab: filters.tab },
    })
  }

  return (
    <TindakLanjutPage
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onResetFilters={handleResetFilters}
    />
  )
}
