import { and, asc, desc, eq, gte, isNull, ne, or, sql } from 'drizzle-orm'
import type { AppDatabase } from '#/db'
import { auditLogs, claims, doctors, fraudClusters, hospitals, users } from '#/db/schema'
import {
  REQUIRED_DOCS_BY_TYPOLOGY,
  parseAiNarrativeCache,
  type StructuredAiNarrative,
} from '#/lib/ai-narrative'
import { evaluateEscalationTriggers } from '#/lib/scoring'
import { FRAUD_TYPOLOGY_META } from '#/lib/status-tokens'
import type {
  ClaimDecisionInput,
  ClaimDetailResponse,
  GenerateClaimAiInput,
  RecordHospitalResponseInput,
  SubmitClaimDecisionResult,
} from '#/schemas/claims.schema'
import type { SessionUser } from '#/schemas/session.schema'
import { generateStructuredClaimAi } from '#/server/ai/gemini-copilot'
import { getWorkerAiEnv } from '#/server/guards/auth.guard'

export async function getClaimDetail(
  db: AppDatabase,
  branchCode: string,
  claimId: string,
): Promise<ClaimDetailResponse | null> {
  const rows = await db
    .select({
      id: claims.id,
      noSep: claims.noSep,
      patientAlias: claims.patientAlias,
      patientNikMasked: claims.patientNikMasked,
      patientGender: claims.patientGender,
      patientAge: claims.patientAge,
      admissionDate: claims.admissionDate,
      dischargeDate: claims.dischargeDate,
      losDays: claims.losDays,
      serviceType: claims.serviceType,
      careClass: claims.careClass,
      hospitalId: hospitals.id,
      hospitalName: hospitals.name,
      facilityType: hospitals.facilityType,
      referringFacility: claims.referringFacility,
      doctorId: doctors.id,
      doctorName: doctors.name,
      doctorSpecialty: doctors.specialty,
      icd10Primary: claims.icd10Primary,
      inacbgCode: claims.inacbgCode,
      inacbgDescription: claims.inacbgDescription,
      tariffIdr: claims.tariffIdr,
      peerAvgTariffIdr: claims.peerAvgTariffIdr,
      hospitalRealCostIdr: claims.hospitalRealCostIdr,
      scoreMedical: claims.scoreMedical,
      scoreStatistical: claims.scoreStatistical,
      scoreNetwork: claims.scoreNetwork,
      riskScore: claims.riskScore,
      riskZone: claims.riskZone,
      fraudTypology: claims.fraudTypology,
      signalSummary: claims.signalSummary,
      status: claims.status,
      slaDueAt: claims.slaDueAt,
      clarificationRequestedAt: claims.clarificationRequestedAt,
      hospitalResponseNote: claims.hospitalResponseNote,
      hospitalRespondedAt: claims.hospitalRespondedAt,
      aiNarrativeCache: claims.aiNarrativeCache,
      aiDraftCache: claims.aiDraftCache,
      escalatedToPkjkn: claims.escalatedToPkjkn,
      decisionNote: claims.decisionNote,
      revisedTariffIdr: claims.revisedTariffIdr,
    })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .innerJoin(doctors, eq(claims.doctorId, doctors.id))
    .where(and(eq(hospitals.branchCode, branchCode), eq(claims.id, claimId)))
    .limit(1)

  const claim = rows[0]
  if (!claim) return null

  const [auditRows, queueIdRows] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        fromStatus: auditLogs.fromStatus,
        toStatus: auditLogs.toStatus,
        actorName: users.name,
        actorRole: auditLogs.actorRole,
        note: auditLogs.note,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.actorId, users.id))
      .where(
        and(eq(auditLogs.entityType, 'claim'), eq(auditLogs.entityId, claimId)),
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(20),
    db
      .select({ id: claims.id })
      .from(claims)
      .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
      .where(
        and(
          eq(hospitals.branchCode, branchCode),
          or(
            eq(claims.status, 'balasan_rs'),
            eq(claims.status, 'klarifikasi'),
            eq(claims.status, 'pending_rs'),
            and(eq(claims.status, 'belum_dicek'), ne(claims.riskZone, 'hijau')),
          ),
        ),
      )
      .orderBy(desc(claims.riskScore), asc(claims.slaDueAt))
      .limit(200),
  ])

  const ids = queueIdRows.map((r) => r.id)
  const pos = ids.indexOf(claimId)

  return {
    claim,
    auditLogs: auditRows.map((entry) => ({
      id: entry.id,
      action: entry.action,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      note: entry.note,
      createdAtIso: entry.createdAt.toISOString(),
    })),
    navigation: {
      index: pos >= 0 ? pos + 1 : 0,
      total: ids.length,
      prevId: pos > 0 ? (ids[pos - 1] ?? null) : null,
      nextId: pos >= 0 && pos < ids.length - 1 ? (ids[pos + 1] ?? null) : null,
    },
  }
}

export async function submitClaimDecision(
  db: AppDatabase,
  actor: SessionUser,
  input: ClaimDecisionInput,
): Promise<SubmitClaimDecisionResult> {
  const existingRows = await db
    .select({
      id: claims.id,
      status: claims.status,
      hospitalId: claims.hospitalId,
      hospitalName: hospitals.name,
      branchCode: hospitals.branchCode,
      doctorId: claims.doctorId,
      fraudTypology: claims.fraudTypology,
      riskScore: claims.riskScore,
      tariffIdr: claims.tariffIdr,
      consecutiveRejections: doctors.consecutiveRejections,
    })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .innerJoin(doctors, eq(claims.doctorId, doctors.id))
    .where(
      and(eq(hospitals.branchCode, actor.branchCode), eq(claims.id, input.claimId)),
    )
    .limit(1)

  const current = existingRows[0]
  if (!current) {
    throw new Error('Berkas klaim tidak ditemukan pada cabang Anda.')
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const isFinal =
    input.decision === 'disetujui' ||
    input.decision === 'false_positive' ||
    input.decision === 'ditolak'

  const nextConsecutiveRejections =
    input.decision === 'ditolak'
      ? current.consecutiveRejections + 1
      : input.decision === 'disetujui' || input.decision === 'false_positive'
        ? 0
        : current.consecutiveRejections

  await db.batch([
    db
      .update(claims)
      .set({
        status: input.decision,
        decisionNote: input.note,
        revisedTariffIdr:
          input.decision === 'pending_rs' ? (input.revisedTariffIdr ?? null) : null,
        escalatedToPkjkn:
          input.decision === 'ditolak'
            ? Boolean(input.escalateToPkjkn)
            : false,
        clarificationRequestedAt:
          input.decision === 'klarifikasi' ? nowIso : undefined,
        verifiedBy: isFinal ? actor.id : null,
        verifiedAt: isFinal ? now : null,
        updatedAt: now,
      })
      .where(eq(claims.id, current.id)),
    db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      entityType: 'claim',
      entityId: current.id,
      action: `decision_${input.decision}`,
      fromStatus: current.status,
      toStatus: input.decision,
      actorId: actor.id,
      actorRole: actor.role,
      note: input.note,
      metadataJson: JSON.stringify({
        tariffIdr: current.tariffIdr,
        revisedTariffIdr: input.revisedTariffIdr ?? null,
        escalatedToPkjkn: Boolean(input.escalateToPkjkn),
      }),
    }),
    db
      .update(doctors)
      .set({ consecutiveRejections: nextConsecutiveRejections })
      .where(eq(doctors.id, current.doctorId)),
  ])

  if (input.decision !== 'ditolak') {
    return {
      claimId: current.id,
      status: input.decision,
      escalated: false,
      clusterCode: null,
      escalationReasons: [],
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [agg] = await db
    .select({
      rejectedSameTypology: sql<number>`coalesce(sum(case when ${claims.fraudTypology} = ${current.fraudTypology} then 1 else 0 end), 0)`,
      rejectedTotalIdr: sql<number>`coalesce(sum(${claims.tariffIdr}), 0)`,
    })
    .from(claims)
    .where(
      and(
        eq(claims.hospitalId, current.hospitalId),
        eq(claims.status, 'ditolak'),
        or(isNull(claims.verifiedAt), gte(claims.verifiedAt, thirtyDaysAgo)),
      ),
    )
    .limit(1)

  const evalResult = evaluateEscalationTriggers({
    rejectedSameTypologyCount30d: Number(agg?.rejectedSameTypology ?? 1),
    rejectedTotalAmountIdr30d: Number(agg?.rejectedTotalIdr ?? current.tariffIdr),
    dpjpConsecutiveRejections: nextConsecutiveRejections,
  })

  if (!evalResult.triggered && !input.escalateToPkjkn) {
    return {
      claimId: current.id,
      status: input.decision,
      escalated: false,
      clusterCode: null,
      escalationReasons: [],
    }
  }

  const clusterId = `CLU-${current.hospitalId}-${current.fraudTypology}`
  const clusterCode = `#${current.hospitalId.slice(-4)}-${current.fraudTypology.slice(0, 3).toUpperCase()}`
  const escalatedCount = Math.max(1, Number(agg?.rejectedSameTypology ?? 1))
  const potentialLossIdr = Math.max(
    current.tariffIdr,
    Number(agg?.rejectedTotalIdr ?? current.tariffIdr),
  )

  await db
    .insert(fraudClusters)
    .values({
      id: clusterId,
      clusterCode,
      title: `${FRAUD_TYPOLOGY_META[current.fraudTypology]} · ${current.hospitalName}`,
      branchCode: current.branchCode,
      primaryHospitalId: current.hospitalId,
      centralDoctorId: current.doctorId,
      riskScore: current.riskScore,
      priorityLevel: current.riskScore >= 70 ? 'kritis' : 'perhatian',
      fraudTypology: current.fraudTypology,
      triggerReason: evalResult.triggerReason ?? 'cluster_frequency',
      escalatedClaimCount: escalatedCount,
      potentialLossIdr,
      followupStage: 'baru',
      finalStatus: 'belum_final',
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: fraudClusters.id,
      set: {
        riskScore: current.riskScore,
        priorityLevel: current.riskScore >= 70 ? 'kritis' : 'perhatian',
        triggerReason: evalResult.triggerReason ?? 'cluster_frequency',
        escalatedClaimCount: escalatedCount,
        potentialLossIdr,
        updatedAt: now,
      },
    })

  const labels: Record<string, string> = {
    cluster_frequency: '≥ 10 penolakan tipologi sama (30 hari)',
    financial_exposure: '≥ Rp 100 Jt akumulasi penolakan RS',
    dpjp_outlier: '≥ 5 penolakan beruntun DPJP',
  }
  const escalationReasons = evalResult.reasons.map((r) => labels[r] ?? r)
  if (input.escalateToPkjkn && escalationReasons.length === 0) {
    escalationReasons.push('Eskalasi langsung PK-JKN oleh verifikator')
  }

  return {
    claimId: current.id,
    status: input.decision,
    escalated: true,
    clusterCode,
    escalationReasons,
  }
}

export async function recordHospitalResponse(
  db: AppDatabase,
  actor: SessionUser,
  input: RecordHospitalResponseInput,
): Promise<{ status: 'balasan_rs' }> {
  const detail = await getClaimDetail(db, actor.branchCode, input.claimId)
  if (!detail) {
    throw new Error('Berkas klaim tidak ditemukan pada cabang Anda.')
  }

  const now = new Date()
  const nowIso = now.toISOString()

  await db.batch([
    db
      .update(claims)
      .set({
        status: 'balasan_rs',
        hospitalResponseNote: input.responseNote,
        hospitalRespondedAt: nowIso,
        updatedAt: now,
      })
      .where(eq(claims.id, detail.claim.id)),
    db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      entityType: 'claim',
      entityId: detail.claim.id,
      action: 'hospital_response_recorded',
      fromStatus: detail.claim.status,
      toStatus: 'balasan_rs',
      actorId: actor.id,
      actorRole: actor.role,
      note: input.responseNote,
    }),
  ])

  return { status: 'balasan_rs' }
}

export async function generateClaimAiCopilot(
  db: AppDatabase,
  actor: SessionUser,
  input: GenerateClaimAiInput,
): Promise<{
  narrative: StructuredAiNarrative
  clarificationDraft: string
  source: 'gemini' | 'fallback' | 'cache'
  cached: boolean
}> {
  const detail = await getClaimDetail(db, actor.branchCode, input.claimId)
  if (!detail) {
    throw new Error('Berkas klaim tidak ditemukan pada cabang Anda.')
  }

  // Hemat kuota token: kembalikan cache D1 selama tidak diminta regenerasi paksa
  if (
    !input.force &&
    detail.claim.aiNarrativeCache &&
    detail.claim.aiDraftCache
  ) {
    const cachedNarrative = parseAiNarrativeCache(detail.claim.aiNarrativeCache)
    if (cachedNarrative) {
      return {
        narrative: cachedNarrative,
        clarificationDraft: detail.claim.aiDraftCache,
        source: 'cache',
        cached: true,
      }
    }
  }

  const requiredDocs =
    input.requiredDocs && input.requiredDocs.length > 0
      ? input.requiredDocs
      : REQUIRED_DOCS_BY_TYPOLOGY[detail.claim.fraudTypology]

  const generated = await generateStructuredClaimAi(
    detail.claim,
    requiredDocs,
    getWorkerAiEnv(),
  )

  await db
    .update(claims)
    .set({
      aiNarrativeCache: JSON.stringify(generated.narrative),
      aiDraftCache: generated.clarificationDraft,
      updatedAt: new Date(),
    })
    .where(eq(claims.id, detail.claim.id))

  return {
    narrative: generated.narrative,
    clarificationDraft: generated.clarificationDraft,
    source: generated.source,
    cached: false,
  }
}
