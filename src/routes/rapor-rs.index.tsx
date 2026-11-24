import { createFileRoute } from '@tanstack/react-router'
import type { z } from 'zod'
import { requireRouteRole } from '#/lib/route-guards'
import { RaporRsPage } from '#/pages/executive/RaporRsPage'
import { hospitalsScorecardQueryOptions } from '#/queries/hospitals.queries'
import { hospitalsFilterSchema } from '#/schemas/hospitals.schema'
import type { HospitalsFilterInput } from '#/schemas/hospitals.schema'

type RaporSearchParams = z.input<typeof hospitalsFilterSchema>

function toFilterInput(raw: RaporSearchParams): HospitalsFilterInput {
  const parsed = hospitalsFilterSchema.safeParse(raw)
  return parsed.success ? parsed.data : hospitalsFilterSchema.parse({})
}

export const Route = createFileRoute('/rapor-rs/')({
  validateSearch: (search: Record<string, unknown>): RaporSearchParams => {
    const parsed = hospitalsFilterSchema.partial().safeParse(search)
    return parsed.success ? parsed.data : {}
  },
  beforeLoad: async ({ context, location }) => {
    await requireRouteRole({ context, location }, ['kepala_cabang'])
  },
  loaderDeps: ({ search }) => toFilterInput(search),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      hospitalsScorecardQueryOptions(deps),
    )
  },
  head: () => ({
    meta: [{ title: 'Rapor Kepatuhan RS Mitra · ClaimGuard AI' }],
  }),
  component: RaporRsRoute,
})

function RaporRsRoute() {
  const rawSearch = Route.useSearch()
  const filters = toFilterInput(rawSearch)
  const navigate = Route.useNavigate()

  const handleFiltersChange = (patch: Partial<HospitalsFilterInput>) => {
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
    <RaporRsPage
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onResetFilters={handleResetFilters}
    />
  )
}
