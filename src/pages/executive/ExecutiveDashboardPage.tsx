import { useDeferredValue, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ExecutiveFilterSection } from '#/components/domain/executive-dashboard/ExecutiveFilterSection'
import { ExecutiveKpiSection } from '#/components/domain/executive-dashboard/ExecutiveKpiSection'
import { ExecutiveOverviewSection } from '#/components/domain/executive-dashboard/ExecutiveOverviewSection'
import {
  EXECUTIVE_PERIOD_OPTIONS,
  exportExecutiveCsv,
} from '#/components/domain/executive-dashboard/executive-dashboard.utils'
import { PageHeader } from '#/components/layout/PageHeader'
import { executiveDashboardQueryOptions } from '#/queries/hospitals.queries'
import type { ExecutiveDashboardFilterInput } from '#/schemas/hospitals.schema'
import type { SessionUser } from '#/schemas/session.schema'

interface ExecutiveDashboardPageProps {
  user: SessionUser
}

const DEFAULT_FILTERS: ExecutiveDashboardFilterInput = {
  period: 'all',
}

export function ExecutiveDashboardPage({ user }: ExecutiveDashboardPageProps) {
  const [filters, setFilters] =
    useState<ExecutiveDashboardFilterInput>(DEFAULT_FILTERS)
  const deferredFilters = useDeferredValue(filters)
  const { data } = useSuspenseQuery(
    executiveDashboardQueryOptions(deferredFilters),
  )

  const { metrics, hospitals, priorityHospitals, typologies } = data
  const periodLabel =
    EXECUTIVE_PERIOD_OPTIONS.find((p) => p.value === filters.period)?.label ??
    'Semua Periode'

  const hasActiveFilter =
    filters.period !== 'all' ||
    Boolean(filters.hospitalId) ||
    Boolean(filters.search)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat Pagi, ${user.name}`}
        subtitle={`Ringkasan eksekutif ${user.unitName} · ${metrics.totalHospitals} FKRTL mitra aktif · Ketahanan dana JKN & rekomendasi evaluasi kontrak PKS.`}
      />

      <ExecutiveFilterSection
        filters={filters}
        hospitals={hospitals}
        unitName={user.unitName}
        hasActiveFilter={hasActiveFilter}
        onFiltersChange={(patch) =>
          setFilters((prev) => ({ ...prev, ...patch }))
        }
        onReset={() => setFilters(DEFAULT_FILTERS)}
        onExport={() =>
          exportExecutiveCsv(priorityHospitals, periodLabel, user.unitName)
        }
      />

      <ExecutiveKpiSection metrics={metrics} unitName={user.unitName} />

      <ExecutiveOverviewSection
        priorityHospitals={priorityHospitals}
        totalHospitalsCount={metrics.totalHospitals}
        typologies={typologies}
      />
    </div>
  )
}
