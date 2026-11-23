import { useDeferredValue, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { RegionalFilterSection } from '#/components/domain/regional-dashboard/RegionalFilterSection'
import { RegionalKpiSection } from '#/components/domain/regional-dashboard/RegionalKpiSection'
import { RegionalOverviewSection } from '#/components/domain/regional-dashboard/RegionalOverviewSection'
import {
  REGIONAL_PERIOD_OPTIONS,
  exportRegionalSummaryCsv,
} from '#/components/domain/regional-dashboard/regional-dashboard.utils'
import { PageHeader } from '#/components/layout/PageHeader'
import { regionalDashboardQueryOptions } from '#/queries/clusters.queries'
import type { RegionalDashboardFilterInput } from '#/schemas/clusters.schema'
import type { SessionUser } from '#/schemas/session.schema'

interface RegionalDashboardPageProps {
  user: SessionUser
}

const DEFAULT_FILTERS: RegionalDashboardFilterInput = {
  period: 'all',
}

export function RegionalDashboardPage({ user }: RegionalDashboardPageProps) {
  const [filters, setFilters] =
    useState<RegionalDashboardFilterInput>(DEFAULT_FILTERS)
  const deferredFilters = useDeferredValue(filters)
  const { data } = useSuspenseQuery(
    regionalDashboardQueryOptions(deferredFilters),
  )

  const { metrics, clusters, branches } = data
  const selectedBranch = branches.find(
    (b) => b.branchCode === filters.branchCode,
  )
  const periodLabel =
    REGIONAL_PERIOD_OPTIONS.find((p) => p.value === filters.period)?.label ??
    'Semua Periode'

  const hasActiveFilter =
    filters.period !== 'all' ||
    Boolean(filters.branchCode) ||
    Boolean(filters.search)

  const handleFiltersChange = (
    patch: Partial<RegionalDashboardFilterInput>,
  ) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat Pagi, ${user.name}`}
        subtitle={`Ringkasan pengawasan FKRTL Jawa Timur · ${metrics.criticalCount} kluster rumah sakit melewati ambang eskalasi bulan ini.`}
      />

      <RegionalFilterSection
        filters={filters}
        branches={branches}
        hasActiveFilter={hasActiveFilter}
        onFiltersChange={handleFiltersChange}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        onExport={() =>
          exportRegionalSummaryCsv(
            clusters,
            periodLabel,
            filters.branchCode ?? 'divre-jatim',
          )
        }
      />

      <RegionalKpiSection
        metrics={metrics}
        branchCount={branches.length}
        selectedBranchName={selectedBranch?.branchName}
      />

      <RegionalOverviewSection
        clusters={clusters}
        branches={branches}
        totalClustersCount={metrics.totalClusters}
        selectedBranchCode={filters.branchCode}
        onToggleBranch={(branchCode) =>
          handleFiltersChange({
            branchCode: filters.branchCode === branchCode ? undefined : branchCode,
          })
        }
      />
    </div>
  )
}
