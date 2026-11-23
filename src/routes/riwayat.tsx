import { createFileRoute } from '@tanstack/react-router'
import type { z } from 'zod'
import { requireRouteRole } from '#/lib/route-guards'
import { RiwayatPage } from '#/pages/verifikator/RiwayatPage'
import { claimsHistoryQueryOptions } from '#/queries/claims-history.queries'
import { claimsHistoryFilterSchema } from '#/schemas/claims.schema'
import type { ClaimsHistoryFilterInput } from '#/schemas/claims.schema'

type RiwayatSearchParams = z.input<typeof claimsHistoryFilterSchema>

function toFilterInput(search: RiwayatSearchParams): ClaimsHistoryFilterInput {
  const parsed = claimsHistoryFilterSchema.safeParse(search)
  return parsed.success ? parsed.data : claimsHistoryFilterSchema.parse({})
}

export const Route = createFileRoute('/riwayat')({
  validateSearch: (search: Record<string, unknown>): RiwayatSearchParams => {
    const parsed = claimsHistoryFilterSchema.partial().safeParse(search)
    return parsed.success ? parsed.data : {}
  },
  beforeLoad: async ({ context, location }) => {
    await requireRouteRole({ context, location }, ['verifikator'])
  },
  loaderDeps: ({ search }) => toFilterInput(search),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(claimsHistoryQueryOptions(deps))
  },
  head: () => ({
    meta: [{ title: 'Riwayat Verifikasi Klaim · ClaimGuard AI' }],
  }),
  component: RiwayatRoute,
})

function RiwayatRoute() {
  const rawSearch = Route.useSearch()
  const filters = toFilterInput(rawSearch)
  const navigate = Route.useNavigate()

  const handleFiltersChange = (patch: Partial<ClaimsHistoryFilterInput>) => {
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
    <RiwayatPage
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onResetFilters={handleResetFilters}
    />
  )
}
