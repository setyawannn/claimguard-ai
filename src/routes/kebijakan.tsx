import { createFileRoute } from '@tanstack/react-router'
import type { z } from 'zod'
import { requireRouteRole } from '#/lib/route-guards'
import { KebijakanPksPage } from '#/pages/executive/KebijakanPksPage'
import { pksDecisionsQueryOptions } from '#/queries/hospitals.queries'
import { pksDecisionsFilterSchema } from '#/schemas/hospitals.schema'
import type { PksDecisionsFilterInput } from '#/schemas/hospitals.schema'

type KebijakanSearchParams = z.input<typeof pksDecisionsFilterSchema>

function toFilterInput(raw: KebijakanSearchParams): PksDecisionsFilterInput {
  const parsed = pksDecisionsFilterSchema.safeParse(raw)
  return parsed.success ? parsed.data : pksDecisionsFilterSchema.parse({})
}

export const Route = createFileRoute('/kebijakan')({
  validateSearch: (search: Record<string, unknown>): KebijakanSearchParams => {
    const parsed = pksDecisionsFilterSchema.partial().safeParse(search)
    return parsed.success ? parsed.data : {}
  },
  beforeLoad: async ({ context, location }) => {
    await requireRouteRole({ context, location }, ['kepala_cabang'])
  },
  loaderDeps: ({ search }) => {
    const parsed = toFilterInput(search)
    return {
      tab: parsed.tab,
      policyPath: parsed.policyPath,
      search: parsed.search,
      onlyWaiting: parsed.onlyWaiting,
    }
  },
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(pksDecisionsQueryOptions(deps))
  },
  head: () => ({
    meta: [{ title: 'Kebijakan & Evaluasi Kontrak PKS · ClaimGuard AI' }],
  }),
  component: KebijakanRoute,
})

function KebijakanRoute() {
  const rawSearch = Route.useSearch()
  const filters = toFilterInput(rawSearch)
  const navigate = Route.useNavigate()

  const handleFiltersChange = (patch: Partial<PksDecisionsFilterInput>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
    })
  }

  const handleResetFilters = () => {
    void navigate({
      search: filters.selectedId ? { selectedId: filters.selectedId } : {},
    })
  }

  return (
    <KebijakanPksPage
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onResetFilters={handleResetFilters}
    />
  )
}
