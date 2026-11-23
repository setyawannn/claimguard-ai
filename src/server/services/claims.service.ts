import { and, asc, desc, eq, inArray, like, ne, or, sql, type SQL } from 'drizzle-orm'
import type { AppDatabase } from '#/db'
import { auditLogs, claims, doctors, hospitals } from '#/db/schema'
import type {
  BulkClaimActionInput,
  ClaimsFilterInput,
  ClaimsQueueResponse,
} from '#/schemas/claims.schema'
import type { SessionUser } from '#/schemas/session.schema'

function buildTabCondition(tab: ClaimsFilterInput['tab']): SQL {
  switch (tab) {
    case 'belum_dicek':
      return eq(claims.status, 'belum_dicek')
    case 'klarifikasi':
      return inArray(claims.status, ['klarifikasi', 'balasan_rs', 'pending_rs'])
    case 'selesai':
      return inArray(claims.status, ['disetujui', 'false_positive', 'ditolak'])
    case 'perlu_telaah':
    default:
      return or(
        inArray(claims.status, ['balasan_rs', 'klarifikasi', 'pending_rs']),
        and(eq(claims.status, 'belum_dicek'), ne(claims.riskZone, 'hijau')),
      )!
  }
}

export async function listClaimsQueue(
  db: AppDatabase,
  branchCode: string,
  filters: ClaimsFilterInput,
): Promise<ClaimsQueueResponse> {
  const hospitalRows = await db
    .select({
      id: hospitals.id,
      name: hospitals.name,
      facilityType: hospitals.facilityType,
    })
    .from(hospitals)
    .where(eq(hospitals.branchCode, branchCode))
    .orderBy(asc(hospitals.name))
    .limit(50)

  const [summaryRow] = await db
    .select({
      perluTelaahCount: sql<number>`coalesce(sum(case when ${claims.status} in ('balasan_rs', 'klarifikasi', 'pending_rs') or (${claims.status} = 'belum_dicek' and ${claims.riskZone} != 'hijau') then 1 else 0 end), 0)`,
      belumDicekCount: sql<number>`coalesce(sum(case when ${claims.status} = 'belum_dicek' then 1 else 0 end), 0)`,
      klarifikasiCount: sql<number>`coalesce(sum(case when ${claims.status} in ('klarifikasi', 'balasan_rs', 'pending_rs') then 1 else 0 end), 0)`,
      selesaiCount: sql<number>`coalesce(sum(case when ${claims.status} in ('disetujui', 'false_positive', 'ditolak') then 1 else 0 end), 0)`,
      readyClarifyCount: sql<number>`coalesce(sum(case when ${claims.status} = 'balasan_rs' then 1 else 0 end), 0)`,
      fastTrackCount: sql<number>`coalesce(sum(case when ${claims.status} = 'belum_dicek' and ${claims.riskZone} = 'hijau' then 1 else 0 end), 0)`,
      fastTrackAmountIdr: sql<number>`coalesce(sum(case when ${claims.status} = 'belum_dicek' and ${claims.riskZone} = 'hijau' then ${claims.tariffIdr} else 0 end), 0)`,
      activeQueueTotalTariffIdr: sql<number>`coalesce(sum(case when ${claims.status} in ('balasan_rs', 'klarifikasi', 'pending_rs') or (${claims.status} = 'belum_dicek' and ${claims.riskZone} != 'hijau') then ${claims.tariffIdr} else 0 end), 0)`,
    })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .where(eq(hospitals.branchCode, branchCode))
    .limit(1)

  const conditions: SQL[] = [
    eq(hospitals.branchCode, branchCode),
    buildTabCondition(filters.tab),
  ]

  if (filters.hospitalId) {
    conditions.push(eq(claims.hospitalId, filters.hospitalId))
  }
  if (filters.status) {
    conditions.push(eq(claims.status, filters.status))
  }
  if (filters.typology) {
    conditions.push(eq(claims.fraudTypology, filters.typology))
  }
  if (filters.search) {
    const pattern = `%${filters.search}%`
    conditions.push(
      or(
        like(claims.noSep, pattern),
        like(claims.patientAlias, pattern),
        like(claims.inacbgCode, pattern),
        like(claims.inacbgDescription, pattern),
        like(claims.signalSummary, pattern),
      )!,
    )
  }

  const whereClause = and(...conditions)

  const [countRow] = await db
    .select({
      totalItems: sql<number>`count(*)`,
      filteredTariffIdr: sql<number>`coalesce(sum(${claims.tariffIdr}), 0)`,
    })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .where(whereClause)
    .limit(1)

  const totalItems = Number(countRow?.totalItems ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.limit))
  const safePage = Math.min(filters.page, totalPages)
  const offset = (safePage - 1) * filters.limit

  const orderBy =
    filters.sort === 'tariff_desc'
      ? [desc(claims.tariffIdr), desc(claims.riskScore)]
      : filters.sort === 'newest'
        ? [desc(claims.admissionDate), desc(claims.riskScore)]
        : [desc(claims.riskScore), asc(claims.slaDueAt)]

  const itemRows = await db
    .select({
      id: claims.id,
      noSep: claims.noSep,
      slaDueAt: claims.slaDueAt,
      admissionDate: claims.admissionDate,
      patientAlias: claims.patientAlias,
      patientGender: claims.patientGender,
      patientAge: claims.patientAge,
      inacbgCode: claims.inacbgCode,
      inacbgDescription: claims.inacbgDescription,
      hospitalId: hospitals.id,
      hospitalName: hospitals.name,
      facilityType: hospitals.facilityType,
      doctorName: doctors.name,
      fraudTypology: claims.fraudTypology,
      signalSummary: claims.signalSummary,
      tariffIdr: claims.tariffIdr,
      riskScore: claims.riskScore,
      riskZone: claims.riskZone,
      status: claims.status,
    })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .innerJoin(doctors, eq(claims.doctorId, doctors.id))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(filters.limit)
    .offset(offset)

  return {
    items: itemRows,
    pagination: {
      page: safePage,
      limit: filters.limit,
      totalItems,
      totalPages,
      filteredTariffIdr: Number(countRow?.filteredTariffIdr ?? 0),
    },
    summary: {
      perluTelaahCount: Number(summaryRow?.perluTelaahCount ?? 0),
      belumDicekCount: Number(summaryRow?.belumDicekCount ?? 0),
      klarifikasiCount: Number(summaryRow?.klarifikasiCount ?? 0),
      selesaiCount: Number(summaryRow?.selesaiCount ?? 0),
      readyClarifyCount: Number(summaryRow?.readyClarifyCount ?? 0),
      fastTrackCount: Number(summaryRow?.fastTrackCount ?? 0),
      fastTrackAmountIdr: Number(summaryRow?.fastTrackAmountIdr ?? 0),
      activeQueueTotalTariffIdr: Number(
        summaryRow?.activeQueueTotalTariffIdr ?? 0,
      ),
    },
    hospitals: hospitalRows,
  }
}

export async function bulkUpdateClaims(
  db: AppDatabase,
  actor: SessionUser,
  input: BulkClaimActionInput,
): Promise<{ updatedCount: number; totalAmountIdr: number; action: BulkClaimActionInput['action'] }> {
  const targetRows = await db
    .select({
      id: claims.id,
      status: claims.status,
      tariffIdr: claims.tariffIdr,
    })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .where(
      and(
        eq(hospitals.branchCode, actor.branchCode),
        inArray(claims.id, input.claimIds),
      ),
    )
    .limit(50)

  if (targetRows.length === 0) {
    throw new Error('Tidak ada berkas klaim yang memenuhi syarat pada cabang Anda.')
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const matchedIds = targetRows.map((row) => row.id)
  const totalAmountIdr = targetRows.reduce((sum, row) => sum + row.tariffIdr, 0)

  const updateFields =
    input.action === 'klarifikasi'
      ? {
          status: 'klarifikasi' as const,
          clarificationRequestedAt: nowIso,
          decisionNote: input.note,
          updatedAt: now,
        }
      : {
          status: 'disetujui' as const,
          verifiedBy: actor.id,
          verifiedAt: now,
          decisionNote: input.note,
          updatedAt: now,
        }

  const auditEntries = targetRows.map((row) => ({
    id: crypto.randomUUID(),
    entityType: 'claim' as const,
    entityId: row.id,
    action: input.action === 'klarifikasi' ? 'bulk_klarifikasi' : 'bulk_setujui',
    fromStatus: row.status,
    toStatus: input.action,
    actorId: actor.id,
    actorRole: actor.role,
    note: input.note,
    metadataJson: JSON.stringify({ tariffIdr: row.tariffIdr }),
  }))

  await db.batch([
    db
      .update(claims)
      .set(updateFields)
      .where(inArray(claims.id, matchedIds)),
    db.insert(auditLogs).values(auditEntries),
  ])

  return {
    updatedCount: targetRows.length,
    totalAmountIdr,
    action: input.action,
  }
}

export async function approveFastTrackClaims(
  db: AppDatabase,
  actor: SessionUser,
  note: string,
): Promise<{ updatedCount: number; totalAmountIdr: number }> {
  const greenClaims = await db
    .select({
      id: claims.id,
      status: claims.status,
      tariffIdr: claims.tariffIdr,
    })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .where(
      and(
        eq(hospitals.branchCode, actor.branchCode),
        eq(claims.status, 'belum_dicek'),
        eq(claims.riskZone, 'hijau'),
      ),
    )
    .limit(100)

  if (greenClaims.length === 0) {
    throw new Error('Tidak ada klaim zona hijau yang menunggu persetujuan Fast-Track.')
  }

  const now = new Date()
  const matchedIds = greenClaims.map((row) => row.id)
  const totalAmountIdr = greenClaims.reduce((sum, row) => sum + row.tariffIdr, 0)

  const auditEntries = greenClaims.map((row) => ({
    id: crypto.randomUUID(),
    entityType: 'claim' as const,
    entityId: row.id,
    action: 'fast_track_approve',
    fromStatus: row.status,
    toStatus: 'disetujui',
    actorId: actor.id,
    actorRole: actor.role,
    note,
    metadataJson: JSON.stringify({ tariffIdr: row.tariffIdr }),
  }))

  await db.batch([
    db
      .update(claims)
      .set({
        status: 'disetujui',
        verifiedBy: actor.id,
        verifiedAt: now,
        decisionNote: note,
        updatedAt: now,
      })
      .where(inArray(claims.id, matchedIds)),
    db.insert(auditLogs).values(auditEntries),
  ])

  return {
    updatedCount: greenClaims.length,
    totalAmountIdr,
  }
}
