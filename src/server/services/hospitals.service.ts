import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import type { AppDatabase } from '#/db'
import {
  auditLogs,
  doctors,
  fraudClusters,
  hospitals,
  pksDecisions,
} from '#/db/schema'
import { safeParseJson } from '#/schemas/hospitals.schema'
import type {
  BulkHospitalPolicyInput,
  BulkHospitalPolicyResult,
  HospitalDetailResponse,
  HospitalScorecardItem,
  HospitalsFilterInput,
  HospitalsScorecardResponse,
  PksRecommendationInput,
  SavePksRecommendationResult,
} from '#/schemas/hospitals.schema'
import type { SessionUser } from '#/schemas/session.schema'

function getGradeLabel(avgScore: number): string {
  if (avgScore >= 88) return 'Grade A'
  if (avgScore >= 78) return 'Grade B+'
  if (avgScore >= 68) return 'Grade B'
  return 'Grade C'
}

export async function listHospitalsScorecard(
  db: AppDatabase,
  branchCode: string,
  filters: HospitalsFilterInput,
): Promise<HospitalsScorecardResponse> {
  const rows = await db
    .select({
      id: hospitals.id,
      code: hospitals.code,
      name: hospitals.name,
      facilityType: hospitals.facilityType,
      directorName: hospitals.directorName,
      bedCapacity: hospitals.bedCapacity,
      borTotalPct: hospitals.borTotalPct,
      borCardioVipPct: hospitals.borCardioVipPct,
      complianceScore: hospitals.complianceScore,
      complianceGrade: hospitals.complianceGrade,
      pilarFastTrackPct: hospitals.pilarFastTrackPct,
      tgrBurdenIdr: hospitals.tgrBurdenIdr,
      pksExpiresAt: hospitals.pksExpiresAt,
      pksStatus: hospitals.pksStatus,
      dominantTypology: hospitals.dominantTypology,
    })
    .from(hospitals)
    .where(eq(hospitals.branchCode, branchCode))
    .orderBy(asc(hospitals.complianceScore))
    .limit(50)

  const mapped: HospitalScorecardItem[] = rows.map((r) => ({
    ...r,
    dominantTypology: r.dominantTypology ?? 'Pemantauan Kepatuhan Rutin',
  }))

  const totalCount = mapped.length
  const evaluasiPksCount = mapped.filter(
    (h) =>
      h.pksStatus === 'evaluasi_pks' ||
      h.pksStatus === 'teguran_sp1' ||
      h.pksStatus === 'pembinaan',
  ).length
  const pantauCount = mapped.filter(
    (h) => h.pksStatus === 'aktif' || h.pksStatus === 'pks_bersyarat',
  ).length
  const mitraPatuhCount = mapped.filter(
    (h) => h.complianceGrade === 'A',
  ).length

  const avgComplianceScore =
    totalCount > 0
      ? Number(
          (
            mapped.reduce((sum, h) => sum + h.complianceScore, 0) / totalCount
          ).toFixed(1),
        )
      : 0

  const searchLower = filters.search?.toLowerCase() ?? ''
  const filtered = mapped.filter((h) => {
    if (
      filters.tab === 'evaluasi_pks' &&
      h.pksStatus !== 'evaluasi_pks' &&
      h.pksStatus !== 'teguran_sp1' &&
      h.pksStatus !== 'pembinaan'
    ) {
      return false
    }
    if (
      filters.tab === 'pantau' &&
      h.pksStatus !== 'aktif' &&
      h.pksStatus !== 'pks_bersyarat'
    ) {
      return false
    }
    if (filters.tab === 'mitra_patuh' && h.complianceGrade !== 'A') {
      return false
    }
    if (filters.pksStatus && h.pksStatus !== filters.pksStatus) return false
    if (filters.facilityType && h.facilityType !== filters.facilityType) {
      return false
    }
    if (searchLower) {
      const hay = `${h.code} ${h.name} ${h.directorName} ${h.dominantTypology}`.toLowerCase()
      if (!hay.includes(searchLower)) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (filters.sort === 'score_desc') {
      return b.complianceScore - a.complianceScore
    }
    if (filters.sort === 'tgr_desc') {
      return b.tgrBurdenIdr - a.tgrBurdenIdr || a.complianceScore - b.complianceScore
    }
    if (filters.sort === 'bor_desc') {
      return b.borTotalPct - a.borTotalPct
    }
    return a.complianceScore - b.complianceScore
  })

  const totalItems = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.limit))
  const safePage = Math.min(filters.page, totalPages)
  const offset = (safePage - 1) * filters.limit

  return {
    items: sorted.slice(offset, offset + filters.limit),
    pagination: {
      page: safePage,
      limit: filters.limit,
      totalItems,
      totalPages,
    },
    summary: {
      totalCount,
      evaluasiPksCount,
      pantauCount,
      mitraPatuhCount,
      avgComplianceScore,
      avgGradeLabel: getGradeLabel(avgComplianceScore),
    },
  }
}

export async function bulkUpdateHospitalPolicy(
  db: AppDatabase,
  actor: SessionUser,
  input: BulkHospitalPolicyInput,
): Promise<BulkHospitalPolicyResult> {
  const existing = await db
    .select({
      id: hospitals.id,
      pksStatus: hospitals.pksStatus,
    })
    .from(hospitals)
    .where(
      and(
        eq(hospitals.branchCode, actor.branchCode),
        inArray(hospitals.id, input.hospitalIds),
      ),
    )
    .limit(20)

  if (existing.length === 0) {
    throw new Error('Tidak ada FKRTL mitra yang valid untuk diperbarui.')
  }

  const now = new Date()
  const targetIds = existing.map((h) => h.id)

  await db.batch([
    db
      .update(hospitals)
      .set({
        pksStatus: input.action,
        updatedAt: now,
      })
      .where(inArray(hospitals.id, targetIds)),
    ...existing.map((item) =>
      db.insert(auditLogs).values({
        id: crypto.randomUUID(),
        entityType: 'pks_decision',
        entityId: item.id,
        action: `bulk_pks_${input.action}`,
        fromStatus: item.pksStatus,
        toStatus: input.action,
        actorId: actor.id,
        actorRole: actor.role,
        note: input.note,
        metadataJson: JSON.stringify({
          hospitalId: item.id,
          action: input.action,
        }),
      }),
    ),
  ])

  return {
    updatedCount: existing.length,
    action: input.action,
  }
}

const STRING_ARRAY_SCHEMA = z.array(z.string())

export async function getHospitalDetail(
  db: AppDatabase,
  branchCode: string,
  hospitalId: string,
): Promise<HospitalDetailResponse | null> {
  const [hospitalRows, navRows, clusterRows, pksRows] = await Promise.all([
    db
      .select({
        id: hospitals.id,
        code: hospitals.code,
        name: hospitals.name,
        facilityType: hospitals.facilityType,
        directorName: hospitals.directorName,
        bedCapacity: hospitals.bedCapacity,
        borTotalPct: hospitals.borTotalPct,
        borCardioVipPct: hospitals.borCardioVipPct,
        complianceScore: hospitals.complianceScore,
        complianceGrade: hospitals.complianceGrade,
        pilarBorScore: hospitals.pilarBorScore,
        pilarCodingScore: hospitals.pilarCodingScore,
        pilarFastTrackPct: hospitals.pilarFastTrackPct,
        pilarResponseScore: hospitals.pilarResponseScore,
        tgrBurdenIdr: hospitals.tgrBurdenIdr,
        pksExpiresAt: hospitals.pksExpiresAt,
        pksStatus: hospitals.pksStatus,
        pksEofficeNumber: hospitals.pksEofficeNumber,
        dominantTypology: hospitals.dominantTypology,
      })
      .from(hospitals)
      .where(
        and(eq(hospitals.branchCode, branchCode), eq(hospitals.id, hospitalId)),
      )
      .limit(1),
    db
      .select({
        id: hospitals.id,
        name: hospitals.name,
      })
      .from(hospitals)
      .where(eq(hospitals.branchCode, branchCode))
      .orderBy(asc(hospitals.complianceScore))
      .limit(50),
    db
      .select({
        id: fraudClusters.id,
        clusterCode: fraudClusters.clusterCode,
        fraudTypology: fraudClusters.fraudTypology,
        escalatedClaimCount: fraudClusters.escalatedClaimCount,
        potentialLossIdr: fraudClusters.potentialLossIdr,
        agreedTgrIdr: fraudClusters.agreedTgrIdr,
        followupStage: fraudClusters.followupStage,
        finalStatus: fraudClusters.finalStatus,
        auditResultNote: fraudClusters.auditResultNote,
        doctorName: doctors.name,
      })
      .from(fraudClusters)
      .leftJoin(doctors, eq(fraudClusters.centralDoctorId, doctors.id))
      .where(eq(fraudClusters.primaryHospitalId, hospitalId))
      .orderBy(desc(fraudClusters.riskScore))
      .limit(1),
    db
      .select({
        id: pksDecisions.id,
        recommendedPolicy: pksDecisions.recommendedPolicy,
        finalPolicy: pksDecisions.finalPolicy,
        tgrCommitmentIdr: pksDecisions.tgrCommitmentIdr,
        addendumRequirementsJson: pksDecisions.addendumRequirementsJson,
        eofficeRefNumber: pksDecisions.eofficeRefNumber,
        executiveNote: pksDecisions.executiveNote,
        isLocked: pksDecisions.isLocked,
      })
      .from(pksDecisions)
      .where(eq(pksDecisions.hospitalId, hospitalId))
      .orderBy(desc(pksDecisions.updatedAt))
      .limit(1),
  ])

  const row = hospitalRows.at(0)
  if (!row) return null

  const pos = navRows.findIndex((item) => item.id === hospitalId)
  const prev = pos > 0 ? navRows.at(pos - 1) : undefined
  const next =
    pos >= 0 && pos < navRows.length - 1 ? navRows.at(pos + 1) : undefined

  const clusterRow = clusterRows.at(0) ?? null
  const pksRow = pksRows.at(0)

  return {
    hospital: {
      ...row,
      dominantTypology: row.dominantTypology ?? 'Pemantauan Kepatuhan Rutin',
      monthlyClaimAvg: Math.max(240, Math.round(row.bedCapacity * 7.8)),
      cluster: clusterRow,
      pksDraft: pksRow
        ? {
            id: pksRow.id,
            recommendedPolicy: pksRow.recommendedPolicy,
            finalPolicy: pksRow.finalPolicy,
            tgrCommitmentIdr: pksRow.tgrCommitmentIdr,
            addendumRequirements: safeParseJson(
              pksRow.addendumRequirementsJson,
              STRING_ARRAY_SCHEMA,
              [],
            ),
            eofficeRefNumber: pksRow.eofficeRefNumber,
            executiveNote: pksRow.executiveNote,
            isLocked: pksRow.isLocked,
          }
        : null,
    },
    navigation: {
      index: pos >= 0 ? pos + 1 : 0,
      total: navRows.length,
      prevId: prev?.id ?? null,
      prevName: prev?.name ?? null,
      nextId: next?.id ?? null,
      nextName: next?.name ?? null,
    },
  }
}

export async function savePksRecommendation(
  db: AppDatabase,
  actor: SessionUser,
  input: PksRecommendationInput,
): Promise<SavePksRecommendationResult> {
  const existing = await db
    .select({
      id: hospitals.id,
      name: hospitals.name,
      pksStatus: hospitals.pksStatus,
      tgrBurdenIdr: hospitals.tgrBurdenIdr,
    })
    .from(hospitals)
    .where(
      and(
        eq(hospitals.branchCode, actor.branchCode),
        eq(hospitals.id, input.hospitalId),
      ),
    )
    .limit(1)

  const hospital = existing.at(0)
  if (!hospital) {
    throw new Error('FKRTL mitra tidak ditemukan pada cabang Anda.')
  }

  const nextPksStatus: HospitalScorecardItem['pksStatus'] =
    input.recommendedPolicy === 'perpanjang'
      ? 'diperpanjang'
      : input.recommendedPolicy

  const decisionId = `pks-${hospital.id}`
  const now = new Date()

  await db.batch([
    db
      .insert(pksDecisions)
      .values({
        id: decisionId,
        hospitalId: hospital.id,
        evaluationPeriod: 'Q3 2026',
        recommendedPolicy: input.recommendedPolicy,
        tgrCommitmentIdr: hospital.tgrBurdenIdr,
        addendumRequirementsJson: JSON.stringify(input.addendumRequirements),
        executiveNote: input.executiveNote,
        isLocked: false,
        decidedBy: actor.id,
        decidedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: pksDecisions.id,
        set: {
          recommendedPolicy: input.recommendedPolicy,
          tgrCommitmentIdr: hospital.tgrBurdenIdr,
          addendumRequirementsJson: JSON.stringify(input.addendumRequirements),
          executiveNote: input.executiveNote,
          decidedBy: actor.id,
          decidedAt: now,
          updatedAt: now,
        },
      }),
    db
      .update(hospitals)
      .set({
        pksStatus: nextPksStatus,
        updatedAt: now,
      })
      .where(eq(hospitals.id, hospital.id)),
    db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      entityType: 'pks_decision',
      entityId: decisionId,
      action: `pks_recommendation_${input.recommendedPolicy}`,
      fromStatus: hospital.pksStatus,
      toStatus: nextPksStatus,
      actorId: actor.id,
      actorRole: actor.role,
      note: input.executiveNote,
      metadataJson: JSON.stringify({
        hospitalId: hospital.id,
        recommendedPolicy: input.recommendedPolicy,
        addendumRequirements: input.addendumRequirements,
      }),
    }),
  ])

  return {
    decisionId,
    hospitalId: hospital.id,
    recommendedPolicy: input.recommendedPolicy,
    pksStatus: nextPksStatus,
  }
}
