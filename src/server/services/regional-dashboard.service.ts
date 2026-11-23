import { desc, eq } from 'drizzle-orm'
import type { AppDatabase } from '#/db'
import { doctors, fraudClusters, hospitals } from '#/db/schema'
import {
  JATIM_BRANCHES,
  JATIM_BRANCH_NAME_MAP,
} from '#/lib/regional-branches'
import type {
  BranchEscalationSummary,
  RegionalClusterItem,
  RegionalDashboardFilterInput,
  RegionalDashboardResponse,
  RegionalTrendPoint,
} from '#/schemas/clusters.schema'

const TREND_POINTS: ReadonlyArray<{ label: string; weight: number }> = [
  { label: '10 Sep', weight: 0.58 },
  { label: '11 Sep', weight: 0.64 },
  { label: '12 Sep', weight: 0.78 },
  { label: '13 Sep', weight: 0.85 },
  { label: '14 Sep', weight: 0.94 },
  { label: 'Hari Ini', weight: 1 },
]

function buildRegionalTrend(
  totalClaims: number,
  totalAmountIdr: number,
): RegionalTrendPoint[] {
  return TREND_POINTS.map((point, idx) => ({
    label: point.label,
    claimsCount: Math.max(1, Math.round(totalClaims * point.weight)),
    amountIdr: Math.round(totalAmountIdr * point.weight),
    highlight: idx === TREND_POINTS.length - 1,
  }))
}

export async function getRegionalDashboard(
  db: AppDatabase,
  filters: RegionalDashboardFilterInput,
): Promise<RegionalDashboardResponse> {
  const rows = await db
    .select({
      id: fraudClusters.id,
      clusterCode: fraudClusters.clusterCode,
      title: fraudClusters.title,
      branchCode: fraudClusters.branchCode,
      hospitalId: hospitals.id,
      hospitalName: hospitals.name,
      doctorName: doctors.name,
      riskScore: fraudClusters.riskScore,
      priorityLevel: fraudClusters.priorityLevel,
      fraudTypology: fraudClusters.fraudTypology,
      escalatedClaimCount: fraudClusters.escalatedClaimCount,
      potentialLossIdr: fraudClusters.potentialLossIdr,
      followupStage: fraudClusters.followupStage,
      auditResultNote: fraudClusters.auditResultNote,
    })
    .from(fraudClusters)
    .innerJoin(hospitals, eq(fraudClusters.primaryHospitalId, hospitals.id))
    .leftJoin(doctors, eq(fraudClusters.centralDoctorId, doctors.id))
    .orderBy(
      desc(fraudClusters.riskScore),
      desc(fraudClusters.potentialLossIdr),
    )
    .limit(100)

  const periodFactor = filters.period === '2026-09' ? 0.94 : 1

  const branches: BranchEscalationSummary[] = JATIM_BRANCHES.map((branch) => {
    const branchRows = rows.filter((r) => r.branchCode === branch.code)
    const criticalCount = branchRows.filter(
      (r) => r.priorityLevel === 'kritis',
    ).length
    return {
      branchCode: branch.code,
      branchName: branch.name,
      hospitalCountLabel: branch.hospitalCountLabel,
      dominantSummary: branch.fallbackSummary,
      clusterCount: branchRows.length,
      criticalCount,
    }
  })

  const scopedByBranch = filters.branchCode
    ? rows.filter((r) => r.branchCode === filters.branchCode)
    : rows

  const searchLower = filters.search?.toLowerCase() ?? ''
  const matchingRows = searchLower
    ? scopedByBranch.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.clusterCode.toLowerCase().includes(searchLower) ||
          r.hospitalName.toLowerCase().includes(searchLower) ||
          (r.doctorName?.toLowerCase().includes(searchLower) ?? false) ||
          (r.auditResultNote?.toLowerCase().includes(searchLower) ?? false),
      )
    : scopedByBranch

  const totalClusters = scopedByBranch.length
  const totalEscalatedClaims = scopedByBranch.reduce(
    (sum, r) => sum + r.escalatedClaimCount,
    0,
  )
  const totalPotentialLossIdr = Math.round(
    scopedByBranch.reduce((sum, r) => sum + r.potentialLossIdr, 0) *
      periodFactor,
  )

  const criticalRows = scopedByBranch.filter(
    (r) => r.priorityLevel === 'kritis',
  )
  const criticalCount = criticalRows.length
  const attentionCount = Math.max(0, totalClusters - criticalCount)
  const criticalPotentialLossIdr = Math.round(
    criticalRows.reduce((sum, r) => sum + r.potentialLossIdr, 0) * periodFactor,
  )

  const collusionRepeatCount = scopedByBranch.filter(
    (r) =>
      r.fraudTypology === 'repeat_billing' ||
      r.fraudTypology === 'self_referral',
  ).length
  const borUpcodingCount = Math.max(0, totalClusters - collusionRepeatCount)

  const readySidakCount = scopedByBranch.filter(
    (r) => r.followupStage === 'sidak_fisik',
  ).length
  const tgrMonitoringCount = Math.max(0, totalClusters - readySidakCount)

  const clusters: RegionalClusterItem[] = matchingRows.slice(0, 12).map((r) => {
    const branchName = JATIM_BRANCH_NAME_MAP.get(r.branchCode) ?? r.branchCode
    return {
      id: r.id,
      clusterCode: r.clusterCode,
      title: r.title,
      branchCode: r.branchCode,
      branchName,
      hospitalId: r.hospitalId,
      hospitalName: r.hospitalName,
      doctorName: r.doctorName,
      riskScore: r.riskScore,
      priorityLevel: r.priorityLevel,
      fraudTypology: r.fraudTypology,
      escalatedClaimCount: r.escalatedClaimCount,
      potentialLossIdr: Math.round(r.potentialLossIdr * periodFactor),
      followupStage: r.followupStage,
      summaryNote:
        r.auditResultNote ??
        `${r.escalatedClaimCount} klaim tereskalasi · ${r.hospitalName}`,
    }
  })

  return {
    metrics: {
      totalClusters,
      totalEscalatedClaims,
      totalPotentialLossIdr,
      criticalCount,
      attentionCount,
      criticalPotentialLossIdr,
      collusionRepeatCount,
      borUpcodingCount,
      readySidakCount,
      tgrMonitoringCount,
      trend: buildRegionalTrend(totalEscalatedClaims, totalPotentialLossIdr),
    },
    clusters,
    branches,
  }
}
