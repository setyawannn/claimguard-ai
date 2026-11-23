import { createFileRoute } from '@tanstack/react-router'
import type { z } from 'zod'
import { requireRouteRole } from '#/lib/route-guards'
import { AntreanPage } from '#/pages/verifikator/AntreanPage'
import { claimsQueueQueryOptions } from '#/queries/claims.queries'
import { claimsFilterSchema } from '#/schemas/claims.schema'
import type { ClaimsFilterInput } from '#/schemas/claims.schema'

type ClaimsSearchParams = z.input<typeof claimsFilterSchema>

function toFilterInput(search: ClaimsSearchParams): ClaimsFilterInput {
  const parsed = claimsFilterSchema.safeParse(search)
  return parsed.success ? parsed.data : claimsFilterSchema.parse({})
}

export const Route = createFileRoute('/antrean/')({
  validateSearch: (search: Record<string, unknown>): ClaimsSearchParams => {
    const parsed = claimsFilterSchema.partial().safeParse(search)
    return parsed.success ? parsed.data : {}
  },
  beforeLoad: async ({ context, location }) => {
    await requireRouteRole({ context, location }, ['verifikator'])
  },
  loaderDeps: ({ search }) => toFilterInput(search),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(claimsQueueQueryOptions(deps))
  },
  head: () => ({
    meta: [{ title: 'Antrean Verifikasi Klaim · ClaimGuard AI' }],
  }),
  component: AntreanRoute,
})

function AntreanRoute() {
  const rawSearch = Route.useSearch()
  const filters = toFilterInput(rawSearch)
  const navigate = Route.useNavigate()

  const handleFiltersChange = (patch: Partial<ClaimsFilterInput>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
    })
  }

  const handleResetFilters = () => {
    void navigate({
      search: filters.tab === 'perlu_telaah' ? {} : { tab: filters.tab },
    })
  }

  return (
    <AntreanPage
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onResetFilters={handleResetFilters}
    />
  )
}
