import { and, asc, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import type { AppDatabase } from '#/db'
import { auditLogs, hospitals, pksDecisions } from '#/db/schema'
import { safeParseJson } from '#/schemas/hospitals.schema'
import type {
  HospitalScorecardItem,
  LockPksDecisionResult,
  PksDecisionRowItem,
  PksDecisionsFilterInput,
  PksDecisionsResponse,
  PksLockInput,
  PksMeetingChecklist,
  pksPolicySchema,
} from '#/schemas/hospitals.schema'
import type { SessionUser } from '#/schemas/session.schema'

type RecommendedPolicy = z.infer<typeof pksPolicySchema>

const STRING_ARRAY_SCHEMA = z.array(z.string())
const CHECKLIST_SCHEMA = z.object({
  baSigned: z.boolean().default(false),
  tgrCommitmentReceived: z.boolean().default(false),
  eofficeRecorded: z.boolean().default(false),
})

function mapStatusToRecommendedPolicy(
  pksStatus: HospitalScorecardItem['pksStatus'],
): RecommendedPolicy {
  switch (pksStatus) {
    case 'evaluasi_pks':
    case 'pks_bersyarat':
      return 'pks_bersyarat'
    case 'teguran_sp1':
      return 'teguran_sp1'
    case 'pembinaan':
    case 'aktif':
      return 'pembinaan'
    case 'diperpanjang':
      return 'perpanjang'
  }
}

function mapFinalPolicyToStatus(
  finalPolicy: string,
  fallbackStatus: HospitalScorecardItem['pksStatus'],
): HospitalScorecardItem['pksStatus'] {
  switch (finalPolicy) {
    case 'PKS Bersyarat 6 Bln':
      return 'pks_bersyarat'
    case 'Teguran Keras SP-2':
      return 'teguran_sp1'
    case 'Perpanjang Penuh':
      return 'diperpanjang'
    case 'Putus Layanan':
      return 'evaluasi_pks'
    default:
      return fallbackStatus
  }
}

export async function listPksDecisions(
  db: AppDatabase,
  branchCode: string,
  filters: PksDecisionsFilterInput,
): Promise<PksDecisionsResponse> {
  const [hospitalRows, decisionRows, auditRows] = await Promise.all([
    db
      .select({
        id: hospitals.id,
        code: hospitals.code,
        name: hospitals.name,
        facilityType: hospitals.facilityType,
        complianceScore: hospitals.complianceScore,
        complianceGrade: hospitals.complianceGrade,
        tgrBurdenIdr: hospitals.tgrBurdenIdr,
        pksExpiresAt: hospitals.pksExpiresAt,
        pksStatus: hospitals.pksStatus,
        pksEofficeNumber: hospitals.pksEofficeNumber,
        dominantTypology: hospitals.dominantTypology,
      })
      .from(hospitals)
      .where(eq(hospitals.branchCode, branchCode))
      .orderBy(asc(hospitals.complianceScore))
      .limit(50),
    db
      .select({
        id: pksDecisions.id,
        hospitalId: pksDecisions.hospitalId,
        recommendedPolicy: pksDecisions.recommendedPolicy,
        finalPolicy: pksDecisions.finalPolicy,
        tgrCommitmentIdr: pksDecisions.tgrCommitmentIdr,
        addendumRequirementsJson: pksDecisions.addendumRequirementsJson,
        meetingChecklistJson: pksDecisions.meetingChecklistJson,
        eofficeRefNumber: pksDecisions.eofficeRefNumber,
        executiveNote: pksDecisions.executiveNote,
        isLocked: pksDecisions.isLocked,
        decidedAt: pksDecisions.decidedAt,
      })
      .from(pksDecisions)
      .orderBy(desc(pksDecisions.updatedAt))
      .limit(100),
    db
      .select({ id: auditLogs.id })
      .from(auditLogs)
      .where(eq(auditLogs.entityType, 'pks_decision'))
      .limit(200),
  ])

  const decisionByHospital = new Map<
    string,
    (typeof decisionRows)[number]
  >()
  for (const row of decisionRows) {
    if (!decisionByHospital.has(row.hospitalId)) {
      decisionByHospital.set(row.hospitalId, row)
    }
  }

  const allItems: PksDecisionRowItem[] = hospitalRows.map((h) => {
    const decision = decisionByHospital.get(h.id)
    const isLocked = decision ? decision.isLocked : h.pksStatus === 'diperpanjang'
    const recommendedPolicy = decision
      ? decision.recommendedPolicy
      : mapStatusToRecommendedPolicy(h.pksStatus)
    const defaultChecklist: PksMeetingChecklist = {
      baSigned: isLocked,
      tgrCommitmentReceived: isLocked,
      eofficeRecorded: isLocked,
    }
    const meetingChecklist = decision
      ? safeParseJson(
          decision.meetingChecklistJson,
          CHECKLIST_SCHEMA,
          defaultChecklist,
        )
      : defaultChecklist

    const defaultNote =
      h.pksStatus === 'diperpanjang'
        ? 'Perpanjangan PKS 2027 reguler (Mitra Patuh · Skor ≥ 85).'
        : h.dominantTypology
          ? `Bahan rapat evaluasi disiapkan · ${h.dominantTypology}.`
          : 'Menunggu agenda rapat evaluasi PKS bersama direksi RS.'

    return {
      decisionId: decision?.id ?? `pks-${h.id}`,
      hospitalId: h.id,
      hospitalCode: h.code,
      hospitalName: h.name,
      facilityType: h.facilityType,
      pksExpiresAt: h.pksExpiresAt,
      complianceScore: h.complianceScore,
      complianceGrade: h.complianceGrade,
      tgrBurdenIdr: h.tgrBurdenIdr,
      pksStatus: h.pksStatus,
      recommendedPolicy,
      finalPolicy:
        decision?.finalPolicy ??
        (h.pksStatus === 'diperpanjang' ? 'Perpanjang Penuh' : null),
      tgrCommitmentIdr: decision ? decision.tgrCommitmentIdr : h.tgrBurdenIdr,
      addendumRequirements: decision
        ? safeParseJson(
            decision.addendumRequirementsJson,
            STRING_ARRAY_SCHEMA,
            [],
          )
        : [],
      meetingChecklist,
      eofficeRefNumber: decision?.eofficeRefNumber ?? h.pksEofficeNumber,
      executiveNote: decision?.executiveNote ?? defaultNote,
      isLocked,
      lockedAt:
        decision && decision.isLocked && decision.decidedAt
          ? decision.decidedAt.toISOString()
          : null,
    }
  })

  const totalCount = allItems.length
  const waitingMeetingCount = allItems.filter((item) => !item.isLocked).length
  const finalCount = allItems.filter((item) => item.isLocked).length
  const conditionalAndSp1Count = allItems.filter(
    (item) =>
      item.pksStatus === 'pks_bersyarat' || item.pksStatus === 'teguran_sp1',
  ).length
  const totalTgrCommitmentIdr = allItems.reduce(
    (sum, item) =>
      sum +
      (item.tgrCommitmentIdr > 0 ? item.tgrCommitmentIdr : item.tgrBurdenIdr),
    0,
  )
  const extendedPatuhCount = allItems.filter(
    (item) => item.complianceScore >= 85 || item.pksStatus === 'diperpanjang',
  ).length

  const searchLower = filters.search?.toLowerCase() ?? ''
  const filtered = allItems.filter((item) => {
    if (filters.tab === 'menunggu_rapat' && item.isLocked) return false
    if (filters.tab === 'final' && !item.isLocked) return false
    if (filters.onlyWaiting && item.isLocked) return false
    if (
      filters.policyPath !== 'all' &&
      item.recommendedPolicy !== filters.policyPath
    ) {
      return false
    }
    if (searchLower) {
      const hay = `${item.hospitalCode} ${item.hospitalName} ${item.eofficeRefNumber ?? ''} ${item.executiveNote ?? ''} ${item.finalPolicy ?? ''} ${item.pksStatus}`.toLowerCase()
      if (!hay.includes(searchLower)) return false
    }
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) =>
      Number(a.isLocked) - Number(b.isLocked) ||
      a.complianceScore - b.complianceScore,
  )

  return {
    items: sorted,
    summary: {
      totalCount,
      waitingMeetingCount,
      finalCount,
      conditionalAndSp1Count,
      totalTgrCommitmentIdr,
      extendedPatuhCount,
    },
    auditTrailCount: auditRows.length,
  }
}

export async function lockPksDecision(
  db: AppDatabase,
  actor: SessionUser,
  input: PksLockInput,
): Promise<LockPksDecisionResult> {
  if (
    !input.meetingChecklist.baSigned ||
    !input.meetingChecklist.tgrCommitmentReceived ||
    !input.meetingChecklist.eofficeRecorded
  ) {
    throw new Error(
      'Seluruh 3 dokumen rapat & e-Office wajib dicentang terverifikasi sebelum mengunci keputusan.',
    )
  }

  const existingDecisions = await db
    .select({
      id: pksDecisions.id,
      hospitalId: pksDecisions.hospitalId,
      recommendedPolicy: pksDecisions.recommendedPolicy,
      tgrCommitmentIdr: pksDecisions.tgrCommitmentIdr,
      addendumRequirementsJson: pksDecisions.addendumRequirementsJson,
    })
    .from(pksDecisions)
    .where(eq(pksDecisions.id, input.decisionId))
    .limit(1)

  const existingDecision = existingDecisions.at(0)
  const targetHospitalId = existingDecision
    ? existingDecision.hospitalId
    : input.decisionId.startsWith('pks-')
      ? input.decisionId.slice(4)
      : input.decisionId

  const hospitalRows = await db
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
        eq(hospitals.id, targetHospitalId),
      ),
    )
    .limit(1)

  const hospital = hospitalRows.at(0)
  if (!hospital) {
    throw new Error('FKRTL mitra tidak ditemukan pada cabang Anda.')
  }

  const decisionId = existingDecision?.id ?? `pks-${hospital.id}`
  const recommendedPolicy =
    existingDecision?.recommendedPolicy ??
    mapStatusToRecommendedPolicy(hospital.pksStatus)
  const tgrCommitmentIdr =
    existingDecision?.tgrCommitmentIdr ?? hospital.tgrBurdenIdr
  const nextPksStatus = mapFinalPolicyToStatus(
    input.finalPolicy,
    hospital.pksStatus,
  )
  const now = new Date()

  await db.batch([
    db
      .insert(pksDecisions)
      .values({
        id: decisionId,
        hospitalId: hospital.id,
        evaluationPeriod: 'Q3 2026',
        recommendedPolicy,
        finalPolicy: input.finalPolicy,
        tgrCommitmentIdr,
        addendumRequirementsJson:
          existingDecision?.addendumRequirementsJson ?? '[]',
        meetingChecklistJson: JSON.stringify(input.meetingChecklist),
        eofficeRefNumber: input.eofficeRefNumber,
        executiveNote: input.executiveNote,
        isLocked: true,
        decidedBy: actor.id,
        decidedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: pksDecisions.id,
        set: {
          finalPolicy: input.finalPolicy,
          meetingChecklistJson: JSON.stringify(input.meetingChecklist),
          eofficeRefNumber: input.eofficeRefNumber,
          executiveNote: input.executiveNote,
          isLocked: true,
          decidedBy: actor.id,
          decidedAt: now,
          updatedAt: now,
        },
      }),
    db
      .update(hospitals)
      .set({
        pksStatus: nextPksStatus,
        pksEofficeNumber: input.eofficeRefNumber,
        updatedAt: now,
      })
      .where(eq(hospitals.id, hospital.id)),
    db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      entityType: 'pks_decision',
      entityId: decisionId,
      action: 'LOCK_PKS_DECISION',
      fromStatus: hospital.pksStatus,
      toStatus: nextPksStatus,
      actorId: actor.id,
      actorRole: actor.role,
      note: `[${input.eofficeRefNumber}] ${input.finalPolicy} — ${input.executiveNote}`,
      metadataJson: JSON.stringify({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        finalPolicy: input.finalPolicy,
        eofficeRefNumber: input.eofficeRefNumber,
        meetingChecklist: input.meetingChecklist,
      }),
    }),
  ])

  return {
    decisionId,
    hospitalId: hospital.id,
    finalPolicy: input.finalPolicy,
    eofficeRefNumber: input.eofficeRefNumber,
    lockedAt: now.toISOString(),
  }
}
