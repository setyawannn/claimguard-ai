import { useMemo, useState } from 'react'
import { DashboardFilterSection } from '#/components/domain/dashboard/DashboardFilterSection'
import {
  DashboardKpiSection,
  type DashboardMetrics,
} from '#/components/domain/dashboard/DashboardKpiSection'
import { DashboardOverviewSection } from '#/components/domain/dashboard/DashboardOverviewSection'
import {
  DASHBOARD_HOSPITALS,
  DASHBOARD_PRIORITY_CASES,
  DASHBOARD_ROLE_SUBTITLE,
  PERIOD_SNAPSHOTS,
  exportDashboardCsv,
  type PeriodKey,
} from '#/components/domain/dashboard/dashboard.data'
import { PageHeader } from '#/components/layout/PageHeader'
import type { SessionUser } from '#/schemas/session.schema'

interface DashboardPageProps {
  user: SessionUser
}

export function DashboardPage({ user }: DashboardPageProps) {
  const [period, setPeriod] = useState<PeriodKey>('2026-09')
  const [hospitalId, setHospitalId] = useState<string>('all')
  const [search, setSearch] = useState('')

  const periodData = PERIOD_SNAPSHOTS[period]
  const selectedHospital = DASHBOARD_HOSPITALS.find((h) => h.id === hospitalId)
  const scale = selectedHospital ? selectedHospital.shareFactor : 1

  const metrics = useMemo<DashboardMetrics>(() => {
    const manualClaims = Math.round(periodData.manualClaims * scale)
    const highRiskCount = Math.round(periodData.highRiskCount * scale)
    return {
      totalClaims: Math.round(periodData.totalClaims * scale),
      totalAmountIdr: Math.round(periodData.totalAmountIdr * scale),
      fastTrackClaims: Math.round(periodData.fastTrackClaims * scale),
      fastTrackAmountIdr: Math.round(periodData.fastTrackAmountIdr * scale),
      manualClaims,
      manualAmountIdr: Math.round(periodData.manualAmountIdr * scale),
      highRiskCount,
      mediumRiskCount: Math.max(0, manualClaims - highRiskCount),
      trend: periodData.trend.map((pt) => ({
        ...pt,
        claimsCount: Math.round(pt.claimsCount * scale),
        amountIdr: Math.round(pt.amountIdr * scale),
      })),
    }
  }, [periodData, scale])

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase()
    return DASHBOARD_PRIORITY_CASES.filter((item) => {
      if (hospitalId !== 'all' && item.hospitalId !== hospitalId) return false
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.meta.toLowerCase().includes(q) ||
        item.sep.toLowerCase().includes(q) ||
        item.hospitalName.toLowerCase().includes(q)
      )
    })
  }, [hospitalId, search])

  const hasActiveFilter =
    period !== '2026-09' || hospitalId !== 'all' || search.trim() !== ''

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat Pagi, ${user.name}`}
        subtitle={DASHBOARD_ROLE_SUBTITLE[user.role](
          user.unitName,
          periodData.clarifyReadyCount,
        )}
      />

      <DashboardFilterSection
        period={period}
        hospitalId={hospitalId}
        search={search}
        hasActiveFilter={hasActiveFilter}
        onPeriodChange={setPeriod}
        onHospitalChange={setHospitalId}
        onSearchChange={setSearch}
        onReset={() => {
          setPeriod('2026-09')
          setHospitalId('all')
          setSearch('')
        }}
        onExport={() =>
          exportDashboardCsv(filteredCases, period, periodData.label, hospitalId)
        }
      />

      <DashboardKpiSection
        metrics={metrics}
        selectedHospitalName={selectedHospital?.name}
        clarifyReadyCount={periodData.clarifyReadyCount}
        clarifyWaitingCount={periodData.clarifyWaitingCount}
        userRole={user.role}
      />

      <DashboardOverviewSection
        cases={filteredCases}
        manualClaimsCount={metrics.manualClaims}
        selectedHospitalId={hospitalId}
        userRole={user.role}
        onToggleHospital={(id) =>
          setHospitalId((prev) => (prev === id ? 'all' : id))
        }
      />
    </div>
  )
}
