import { asc, eq, sql } from 'drizzle-orm'
import type { AppDatabase } from '#/db'
import { claims, hospitals } from '#/db/schema'
import type {
  ExecutiveDashboardFilterInput,
  ExecutiveDashboardResponse,
  ExecutiveHospitalScoreItem,
  ExecutiveTrendPoint,
  ExecutiveTypologySummary,
} from '#/schemas/hospitals.schema'

const TREND_WEIGHTS: ReadonlyArray<{ label: string; weight: number }> = [
  { label: 'Jul', weight: 0.42 },
  { label: 'Agu', weight: 0.65 },
  { label: 'Sep', weight: 0.79 },
  { label: 'Okt', weight: 1 },
]

function buildExecutiveTrend(
  totalClaims: number,
  totalAmountIdr: number,
): ExecutiveTrendPoint[] {
  return TREND_WEIGHTS.map((pt, idx) => ({
    label: pt.label,
    claimsCount: Math.max(1, Math.round(totalClaims * pt.weight)),
    amountIdr: Math.round(totalAmountIdr * pt.weight),
    highlight: idx === TREND_WEIGHTS.length - 1,
  }))
}

export async function getExecutiveDashboard(
  db: AppDatabase,
  branchCode: string,
  filters: ExecutiveDashboardFilterInput,
): Promise<ExecutiveDashboardResponse> {
  const [hospitalRows, claimSummaryRows, typologyRows] = await Promise.all([
    db
      .select({
        id: hospitals.id,
        code: hospitals.code,
        name: hospitals.name,
        facilityType: hospitals.facilityType,
        complianceScore: hospitals.complianceScore,
        complianceGrade: hospitals.complianceGrade,
        borTotalPct: hospitals.borTotalPct,
        borCardioVipPct: hospitals.borCardioVipPct,
        pilarFastTrackPct: hospitals.pilarFastTrackPct,
        tgrBurdenIdr: hospitals.tgrBurdenIdr,
        pksExpiresAt: hospitals.pksExpiresAt,
        pksStatus: hospitals.pksStatus,
        dominantTypology: hospitals.dominantTypology,
      })
      .from(hospitals)
      .where(eq(hospitals.branchCode, branchCode))
      .orderBy(asc(hospitals.complianceScore))
      .limit(50),
    db
      .select({
        totalClaims: sql<number>`count(*)`,
        fastTrackCount: sql<number>`coalesce(sum(case when ${claims.riskZone} = 'hijau' then 1 else 0 end), 0)`,
        rejectedAmountIdr: sql<number>`coalesce(sum(case when ${claims.status} = 'ditolak' then ${claims.tariffIdr} else 0 end), 0)`,
        avoidedAmountIdr: sql<number>`coalesce(sum(case when ${claims.status} in ('ditolak', 'pending_rs', 'klarifikasi') then ${claims.tariffIdr} else 0 end), 0)`,
      })
      .from(claims)
      .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
      .where(eq(hospitals.branchCode, branchCode))
      .limit(1),
    db
      .select({
        fraudTypology: claims.fraudTypology,
        caseCount: sql<number>`count(*)`,
        totalTariffIdr: sql<number>`coalesce(sum(${claims.tariffIdr}), 0)`,
      })
      .from(claims)
      .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
      .where(eq(hospitals.branchCode, branchCode))
      .groupBy(claims.fraudTypology)
      .limit(10),
  ])

  const periodFactor = filters.period === '2026-10' ? 0.92 : 1
  const mappedHospitals: ExecutiveHospitalScoreItem[] = hospitalRows.map(
    (h) => ({
      id: h.id,
      code: h.code,
      name: h.name,
      facilityType: h.facilityType,
      complianceScore: h.complianceScore,
      complianceGrade: h.complianceGrade,
      borTotalPct: h.borTotalPct,
      borCardioVipPct: h.borCardioVipPct,
      pilarFastTrackPct: h.pilarFastTrackPct,
      tgrBurdenIdr: h.tgrBurdenIdr,
      pksExpiresAt: h.pksExpiresAt,
      pksStatus: h.pksStatus,
      dominantTypology:
        h.dominantTypology ?? 'Pemantauan Kepatuhan Rutin',
    }),
  )

  const scopedHospitals = filters.hospitalId
    ? mappedHospitals.filter((h) => h.id === filters.hospitalId)
    : mappedHospitals

  const searchLower = filters.search?.toLowerCase() ?? ''
  const priorityHospitals = scopedHospitals.filter((h) => {
    if (!searchLower) return true
    return (
      h.name.toLowerCase().includes(searchLower) ||
      h.code.toLowerCase().includes(searchLower) ||
      h.pksStatus.toLowerCase().includes(searchLower) ||
      h.dominantTypology.toLowerCase().includes(searchLower)
    )
  })

  const totalTgrIdr = scopedHospitals.reduce(
    (sum, h) => sum + h.tgrBurdenIdr,
    0,
  )
  const claimSummary = claimSummaryRows[0]
  const costAvoidanceIdr = Math.round(
    Number(claimSummary.avoidedAmountIdr) * periodFactor,
  )
  const fundsSecuredIdr = costAvoidanceIdr + totalTgrIdr

  const sp1AndEvaluasiCount = scopedHospitals.filter(
    (h) => h.pksStatus === 'evaluasi_pks' || h.pksStatus === 'teguran_sp1',
  ).length
  const pembinaanCount = scopedHospitals.filter(
    (h) => h.pksStatus === 'pembinaan',
  ).length
  const needEvaluationCount = sp1AndEvaluasiCount + pembinaanCount

  const typologyMap = new Map(
    typologyRows.map((t) => [
      t.fraudTypology,
      { count: Number(t.caseCount), amount: Number(t.totalTariffIdr) },
    ]),
  )

  const repeatStats = typologyMap.get('repeat_billing') ?? {
    count: 0,
    amount: 0,
  }
  const phantomStats = typologyMap.get('phantom_billing') ?? {
    count: 0,
    amount: 0,
  }
  const upcodingStats = typologyMap.get('upcoding') ?? { count: 0, amount: 0 }
  const unbundlingStats = typologyMap.get('unbundling') ?? {
    count: 0,
    amount: 0,
  }
  const selfReferralStats = typologyMap.get('self_referral') ?? {
    count: 0,
    amount: 0,
  }

  const unbundlingCombined = {
    count: unbundlingStats.count + selfReferralStats.count,
    amount: unbundlingStats.amount + selfReferralStats.amount,
  }

  const totalAnomaliCount = Math.max(
    1,
    repeatStats.count +
      phantomStats.count +
      upcodingStats.count +
      unbundlingCombined.count,
  )

  const repeatPhantomPct = Math.round(
    ((repeatStats.count + phantomStats.count) / totalAnomaliCount) * 100,
  )
  const upcodingUnbundlingPct = Math.max(0, 100 - repeatPhantomPct)

  const typologies: ExecutiveTypologySummary[] = [
    {
      key: 'repeat_billing',
      title: 'Repeat Billing & Readmisi',
      caseCount: repeatStats.count,
      percentShare: Math.round((repeatStats.count / totalAnomaliCount) * 100),
      amountIdr: repeatStats.amount,
      subtitle: 'Kateterisasi PCI & Rawat Inap < 14 Hr',
      zone: 'merah',
    },
    {
      key: 'phantom_billing',
      title: 'Phantom Billing & BOR',
      caseCount: phantomStats.count,
      percentShare: Math.round((phantomStats.count / totalAnomaliCount) * 100),
      amountIdr: phantomStats.amount,
      subtitle: 'Klaim Melebihi Kapasitas Kasur',
      zone: 'merah',
    },
    {
      key: 'upcoding',
      title: 'Upcoding INA-CBG',
      caseCount: upcodingStats.count,
      percentShare: Math.round((upcodingStats.count / totalAnomaliCount) * 100),
      amountIdr: upcodingStats.amount,
      subtitle: 'Naikkan Severity Level tanpa Penunjang',
      zone: 'kuning',
    },
    {
      key: 'unbundling',
      title: 'Unbundling & Rujukan Semu',
      caseCount: unbundlingCombined.count,
      percentShare: Math.round(
        (unbundlingCombined.count / totalAnomaliCount) * 100,
      ),
      amountIdr: unbundlingCombined.amount,
      subtitle: 'Pemecahan Paket Obat & Rujukan Sirkular',
      zone: 'kuning',
    },
  ]

  const totalClaims = Math.max(1, Number(claimSummary.totalClaims))
  const fastTrackCount = Number(claimSummary.fastTrackCount)
  const avgFastTrack =
    scopedHospitals.length > 0
      ? Number(
          (
            scopedHospitals.reduce((s, h) => s + h.pilarFastTrackPct, 0) /
            scopedHospitals.length
          ).toFixed(1),
        )
      : Number(((fastTrackCount / totalClaims) * 100).toFixed(1))

  return {
    metrics: {
      totalHospitals: mappedHospitals.length,
      fundsSecuredIdr,
      costAvoidanceIdr,
      totalTgrIdr,
      needEvaluationCount,
      sp1AndEvaluasiCount,
      pembinaanCount,
      repeatPhantomPct,
      upcodingUnbundlingPct,
      fastTrackPct: avgFastTrack,
      fastTrackCount,
      slaPct: 98.2,
      trend: buildExecutiveTrend(totalClaims, fundsSecuredIdr),
    },
    hospitals: mappedHospitals,
    priorityHospitals,
    typologies,
  }
}
