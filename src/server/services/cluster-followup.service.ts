import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { AppDatabase } from '#/db'
import { auditLogs, fraudClusters, hospitals } from '#/db/schema'
import {
  JATIM_BRANCHES,
  JATIM_BRANCH_NAME_MAP,
} from '#/lib/regional-branches'
import type {
  ClusterFieldChecklist,
  ClusterFollowupFilterInput,
  ClusterFollowupItem,
  ClusterFollowupResponse,
  ClusterFinalizeInput,
  FinalizeClusterResult,
  InvestigationBranchOption,
} from '#/schemas/clusters.schema'
import type { SessionUser } from '#/schemas/session.schema'

const DEFAULT_CHECKLIST: ClusterFieldChecklist = {
  cctvChecked: false,
  registerMatched: false,
  bapSigned: false,
}

function parseChecklist(rawJson: string): ClusterFieldChecklist {
  try {
    const parsed = JSON.parse(rawJson) as Partial<ClusterFieldChecklist>
    return {
      cctvChecked: Boolean(parsed.cctvChecked),
      registerMatched: Boolean(parsed.registerMatched),
      bapSigned: Boolean(parsed.bapSigned),
    }
  } catch {
    return { ...DEFAULT_CHECKLIST }
  }
}

export async function listClusterFollowups(
  db: AppDatabase,
  filters: ClusterFollowupFilterInput,
): Promise<ClusterFollowupResponse> {
  const rows = await db
    .select({
      id: fraudClusters.id,
      clusterCode: fraudClusters.clusterCode,
      title: fraudClusters.title,
      branchCode: fraudClusters.branchCode,
      hospitalId: hospitals.id,
      hospitalName: hospitals.name,
      pksStatus: hospitals.pksStatus,
      fraudTypology: fraudClusters.fraudTypology,
      riskScore: fraudClusters.riskScore,
      escalatedClaimCount: fraudClusters.escalatedClaimCount,
      potentialLossIdr: fraudClusters.potentialLossIdr,
      agreedTgrIdr: fraudClusters.agreedTgrIdr,
      followupStage: fraudClusters.followupStage,
      finalStatus: fraudClusters.finalStatus,
      fieldChecklistJson: fraudClusters.fieldChecklistJson,
      auditResultNote: fraudClusters.auditResultNote,
      updatedAt: fraudClusters.updatedAt,
    })
    .from(fraudClusters)
    .innerJoin(hospitals, eq(fraudClusters.primaryHospitalId, hospitals.id))
    .orderBy(
      desc(fraudClusters.updatedAt),
      desc(fraudClusters.riskScore),
    )
    .limit(100)

  const branches: InvestigationBranchOption[] = JATIM_BRANCHES.map((b) => ({
    branchCode: b.code,
    branchName: b.name,
    clusterCount: rows.filter((r) => r.branchCode === b.code).length,
  }))

  const isRowPending = (r: (typeof rows)[number]) =>
    r.finalStatus === 'belum_final'

  const totalCount = rows.length
  const pendingFieldCount = rows.filter(isRowPending).length
  const finalizedCount = totalCount - pendingFieldCount
  const totalTgrIdr = rows.reduce((sum, r) => sum + r.agreedTgrIdr, 0)
  const tgrHospitalCount = new Set(
    rows
      .filter((r) => r.agreedTgrIdr > 0 || r.finalStatus === 'tagih_tgr')
      .map((r) => r.hospitalId),
  ).size
  const pksHospitalCount = new Set(
    rows
      .filter(
        (r) =>
          r.followupStage === 'evaluasi_pks' ||
          r.finalStatus === 'kirim_pak_rudi' ||
          r.pksStatus === 'evaluasi_pks',
      )
      .map((r) => r.hospitalId),
  ).size
  const archivedCount = rows.filter(
    (r) => r.finalStatus === 'arsip_wajar' || r.followupStage === 'arsip_wajar',
  ).length

  const searchLower = filters.search?.toLowerCase() ?? ''
  const filteredRows = rows.filter((r) => {
    const pending = isRowPending(r)
    if (filters.tab === 'menunggu' && !pending) return false
    if (filters.tab === 'selesai' && pending) return false
    if (filters.onlyPendingField && !pending) return false
    if (filters.branchCode && r.branchCode !== filters.branchCode) return false
    if (filters.stage && r.followupStage !== filters.stage) return false
    if (searchLower) {
      const hay = [
        r.clusterCode,
        r.title,
        r.hospitalName,
        r.auditResultNote ?? '',
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(searchLower)) return false
    }
    return true
  })

  const totalItems = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.limit))
  const safePage = Math.min(filters.page, totalPages)
  const offset = (safePage - 1) * filters.limit
  const pagedRows = filteredRows.slice(offset, offset + filters.limit)

  const pageIds = pagedRows.map((r) => r.id)
  const initialNoteByCluster = new Map<string, string>()

  if (pageIds.length > 0) {
    const logs = await db
      .select({
        entityId: auditLogs.entityId,
        note: auditLogs.note,
        action: auditLogs.action,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, 'cluster'),
          inArray(auditLogs.entityId, pageIds),
        ),
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageIds.length * 4)

    for (const log of logs) {
      if (!initialNoteByCluster.has(log.entityId) && log.note) {
        initialNoteByCluster.set(log.entityId, log.note)
      }
    }
  }

  const items: ClusterFollowupItem[] = pagedRows.map((r) => {
    const branchName = JATIM_BRANCH_NAME_MAP.get(r.branchCode) ?? r.branchCode
    const defaultInstruction = `Periksa kesesuaian CCTV unit layanan, buku register tindakan, dan kelengkapan ${r.escalatedClaimCount} berkas klaim di ${r.hospitalName}.`
    return {
      id: r.id,
      clusterCode: r.clusterCode,
      title: r.title,
      branchCode: r.branchCode,
      branchName,
      hospitalId: r.hospitalId,
      hospitalName: r.hospitalName,
      fraudTypology: r.fraudTypology,
      riskScore: r.riskScore,
      escalatedClaimCount: r.escalatedClaimCount,
      potentialLossIdr: r.potentialLossIdr,
      agreedTgrIdr: r.agreedTgrIdr,
      followupStage: r.followupStage,
      finalStatus: r.finalStatus,
      isPendingField: isRowPending(r),
      checklist: parseChecklist(r.fieldChecklistJson),
      initialInstruction:
        initialNoteByCluster.get(r.id) ??
        r.auditResultNote ??
        defaultInstruction,
      auditResultNote: r.auditResultNote,
      eventDateIso: r.updatedAt.toISOString(),
    }
  })

  return {
    items,
    pagination: {
      page: safePage,
      limit: filters.limit,
      totalItems,
      totalPages,
    },
    summary: {
      totalCount,
      pendingFieldCount,
      finalizedCount,
      totalTgrIdr,
      tgrHospitalCount,
      pksHospitalCount,
      archivedCount,
    },
    branches,
  }
}

export async function finalizeClusterAudit(
  db: AppDatabase,
  actor: SessionUser,
  input: ClusterFinalizeInput,
): Promise<FinalizeClusterResult> {
  const existing = await db
    .select({
      id: fraudClusters.id,
      clusterCode: fraudClusters.clusterCode,
      finalStatus: fraudClusters.finalStatus,
      primaryHospitalId: fraudClusters.primaryHospitalId,
      hospitalName: hospitals.name,
    })
    .from(fraudClusters)
    .innerJoin(hospitals, eq(fraudClusters.primaryHospitalId, hospitals.id))
    .where(eq(fraudClusters.id, input.clusterId))
    .limit(1)

  const cluster = existing.at(0)
  if (!cluster) {
    throw new Error('Kluster tindak lanjut tidak ditemukan di basis data.')
  }

  const now = new Date()

  await db.batch([
    db
      .update(fraudClusters)
      .set({
        followupStage: input.followupStage,
        finalStatus: input.finalStatus,
        agreedTgrIdr: input.agreedTgrIdr,
        fieldChecklistJson: JSON.stringify(input.checklist),
        auditResultNote: input.auditResultNote,
        assignedAuditorId: actor.id,
        updatedAt: now,
      })
      .where(eq(fraudClusters.id, cluster.id)),
    db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      entityType: 'cluster',
      entityId: cluster.id,
      action: `finalize_${input.finalStatus}`,
      fromStatus: cluster.finalStatus,
      toStatus: input.finalStatus,
      actorId: actor.id,
      actorRole: actor.role,
      note: input.auditResultNote,
      metadataJson: JSON.stringify({
        clusterCode: cluster.clusterCode,
        followupStage: input.followupStage,
        agreedTgrIdr: input.agreedTgrIdr,
        checklist: input.checklist,
      }),
    }),
  ])

  const [tgrAgg] = await db
    .select({
      totalTgr: sql<number>`coalesce(sum(${fraudClusters.agreedTgrIdr}), 0)`,
    })
    .from(fraudClusters)
    .where(eq(fraudClusters.primaryHospitalId, cluster.primaryHospitalId))
    .limit(1)

  const shouldFlagPks =
    input.finalStatus === 'kirim_pak_rudi' ||
    input.followupStage === 'evaluasi_pks'

  await db
    .update(hospitals)
    .set({
      tgrBurdenIdr: Number(tgrAgg.totalTgr),
      ...(shouldFlagPks ? { pksStatus: 'evaluasi_pks' as const } : {}),
      updatedAt: now,
    })
    .where(eq(hospitals.id, cluster.primaryHospitalId))

  return {
    clusterId: cluster.id,
    clusterCode: cluster.clusterCode,
    hospitalName: cluster.hospitalName,
    followupStage: input.followupStage,
    finalStatus: input.finalStatus,
    agreedTgrIdr: input.agreedTgrIdr,
  }
}
