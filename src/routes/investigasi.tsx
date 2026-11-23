import { createFileRoute } from '@tanstack/react-router'
import type { z } from 'zod'
import { requireRouteRole } from '#/lib/route-guards'
import { InvestigasiPage } from '#/pages/regional/InvestigasiPage'
import { clusterInvestigationQueryOptions } from '#/queries/clusters.queries'
import { investigationSearchSchema } from '#/schemas/clusters.schema'
import type { InvestigationSearchInput } from '#/schemas/clusters.schema'

type InvestigationSearchParams = z.input<typeof investigationSearchSchema>

function toSearchInput(
  raw: InvestigationSearchParams,
): InvestigationSearchInput {
  const parsed = investigationSearchSchema.safeParse(raw)
  return parsed.success ? parsed.data : {}
}

export const Route = createFileRoute('/investigasi')({
  validateSearch: (
    search: Record<string, unknown>,
  ): InvestigationSearchParams => {
    const parsed = investigationSearchSchema.partial().safeParse(search)
    return parsed.success ? parsed.data : {}
  },
  beforeLoad: async ({ context, location }) => {
    await requireRouteRole({ context, location }, ['auditor_wilayah'])
  },
  loaderDeps: ({ search }) => toSearchInput(search),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      clusterInvestigationQueryOptions(deps),
    )
  },
  head: () => ({
    meta: [{ title: 'Investigasi & Peta Jejaring Kolusi · ClaimGuard AI' }],
  }),
  component: InvestigasiRoute,
})

function InvestigasiRoute() {
  const rawSearch = Route.useSearch()
  const search = toSearchInput(rawSearch)
  const navigate = Route.useNavigate()

  const handleSearchChange = (patch: Partial<InvestigationSearchInput>) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
    })
  }

  return <InvestigasiPage search={search} onSearchChange={handleSearchChange} />
}
