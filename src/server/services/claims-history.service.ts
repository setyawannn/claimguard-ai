import {
  and,
  asc,
  desc,
  eq,
  inArray,
  like,
  ne,
  or,
  sql,
} from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { AppDatabase } from '#/db'
import { auditLogs, claims, doctors, hospitals } from '#/db/schema'
import type {
  ClaimHistoryItem,
  ClaimsHistoryFilterInput,
  ClaimsHistoryResponse,
  HistoryPeriodOption,
} from '#/schemas/claims.schema'

const FULL_MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

const FINAL_STATUSES = [
  'disetujui',
  'false_positive',
  'pending_rs',
  'ditolak',
] as const

const NEED_FINAL_STATUSES = ['klarifikasi', 'balasan_rs'] as const

function formatPeriodLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number)
  if (!year || !month || month < 1 || month > 12) return yyyyMm
  return `${FULL_MONTHS_ID[month - 1]} ${year}`
}

function buildTabCondition(tab: ClaimsHistoryFilterInput['tab']): SQL | null {
  if (tab === 'perlu_final') {
    return inArray(claims.status, [...NEED_FINAL_STATUSES])
  }
  if (tab === 'sudah_final') {
    return inArray(claims.status, [...FINAL_STATUSES])
  }
  return null
}

function resolveFromStatusLabel(args: {
  currentStatus: ClaimHistoryItem['status']
  latestFromStatus: string | null
  riskScore: number
  hasClarificationContext: boolean
}): string {
  if (
    args.currentStatus === 'klarifikasi' ||
    args.currentStatus === 'balasan_rs'
  ) {
    return 'Klarifikasi'
  }
  if (
    args.latestFromStatus === 'klarifikasi' ||
    args.latestFromStatus === 'balasan_rs'
  ) {
    return 'Klarifikasi'
  }
  if (args.latestFromStatus === 'pending_rs') {
    return 'Pending RS'
  }
  if (args.hasClarificationContext) {
    return 'Klarifikasi'
  }
  if (args.riskScore >= 40) {
    return 'Anomali AI'
  }
  return 'Fast-Track'
}

export async function listClaimsHistory(
  db: AppDatabase,
  branchCode: string,
  filters: ClaimsHistoryFilterInput,
): Promise<ClaimsHistoryResponse> {
  const [hospitalRows, periodRows, summaryRows] = await Promise.all([
    db
      .select({
        id: hospitals.id,
        name: hospitals.name,
        facilityType: hospitals.facilityType,
      })
      .from(hospitals)
      .where(eq(hospitals.branchCode, branchCode))
      .orderBy(asc(hospitals.name))
      .limit(50),
    db
      .selectDistinct({
        period: sql<string>`substr(${claims.admissionDate}, 1, 7)`,
      })
      .from(claims)
      .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
      .where(
        and(eq(hospitals.branchCode, branchCode), ne(claims.status, 'belum_dicek')),
      )
      .orderBy(desc(sql`substr(${claims.admissionDate}, 1, 7)`))
      .limit(24),
    db
      .select({
        totalCount: sql<number>`count(*)`,
        needFinalCount: sql<number>`coalesce(sum(case when ${claims.status} in ('klarifikasi', 'balasan_rs') then 1 else 0 end), 0)`,
        finalizedCount: sql<number>`coalesce(sum(case when ${claims.status} in ('disetujui', 'false_positive', 'pending_rs', 'ditolak') then 1 else 0 end), 0)`,
        approvedCount: sql<number>`coalesce(sum(case when ${claims.status} = 'disetujui' then 1 else 0 end), 0)`,
        approvedAmountIdr: sql<number>`coalesce(sum(case when ${claims.status} = 'disetujui' then ${claims.tariffIdr} else 0 end), 0)`,
        falsePositiveCount: sql<number>`coalesce(sum(case when ${claims.status} = 'false_positive' then 1 else 0 end), 0)`,
        pendingRsCount: sql<number>`coalesce(sum(case when ${claims.status} = 'pending_rs' then 1 else 0 end), 0)`,
        rejectedCount: sql<number>`coalesce(sum(case when ${claims.status} = 'ditolak' then 1 else 0 end), 0)`,
        rejectedSavingsIdr: sql<number>`coalesce(sum(case when ${claims.status} = 'ditolak' then ${claims.tariffIdr} else 0 end), 0)`,
      })
      .from(claims)
      .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
      .where(
        and(eq(hospitals.branchCode, branchCode), ne(claims.status, 'belum_dicek')),
      )
      .limit(1),
  ])

  const summaryRow = summaryRows[0]
  const periods: HistoryPeriodOption[] = periodRows
    .map((r) => r.period)
    .filter((p) => /^\d{4}-\d{2}$/.test(p))
    .map((value) => ({ value, label: formatPeriodLabel(value) }))

  const conditions: SQL[] = [
    eq(hospitals.branchCode, branchCode),
    ne(claims.status, 'belum_dicek'),
  ]

  const tabCondition = buildTabCondition(filters.tab)
  if (tabCondition) {
    conditions.push(tabCondition)
  }
  if (filters.onlyNeedFinal) {
    conditions.push(inArray(claims.status, [...NEED_FINAL_STATUSES]))
  }
  if (filters.period) {
    conditions.push(like(claims.admissionDate, `${filters.period}%`))
  }
  if (filters.hospitalId) {
    conditions.push(eq(claims.hospitalId, filters.hospitalId))
  }
  if (filters.status) {
    conditions.push(eq(claims.status, filters.status))
  }
  if (filters.search) {
    const pattern = `%${filters.search}%`
    conditions.push(
      or(
        like(claims.noSep, pattern),
        like(claims.patientAlias, pattern),
        like(claims.decisionNote, pattern),
        like(claims.hospitalResponseNote, pattern),
        like(hospitals.name, pattern),
        like(claims.inacbgDescription, pattern),
      )!,
    )
  }

  const whereClause = and(...conditions)

  const [countRow] = await db
    .select({ totalItems: sql<number>`count(*)` })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .where(whereClause)
    .limit(1)

  const totalItems = Number(countRow.totalItems)
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.limit))
  const safePage = Math.min(filters.page, totalPages)
  const offset = (safePage - 1) * filters.limit

  const rows = await db
    .select({
      id: claims.id,
      noSep: claims.noSep,
      admissionDate: claims.admissionDate,
      verifiedAt: claims.verifiedAt,
      updatedAt: claims.updatedAt,
      patientAlias: claims.patientAlias,
      patientGender: claims.patientGender,
      patientAge: claims.patientAge,
      inacbgCode: claims.inacbgCode,
      inacbgDescription: claims.inacbgDescription,
      hospitalId: hospitals.id,
      hospitalName: hospitals.name,
      facilityType: hospitals.facilityType,
      doctorName: doctors.name,
      tariffIdr: claims.tariffIdr,
      revisedTariffIdr: claims.revisedTariffIdr,
      riskScore: claims.riskScore,
      fraudTypology: claims.fraudTypology,
      signalSummary: claims.signalSummary,
      status: claims.status,
      clarificationRequestedAt: claims.clarificationRequestedAt,
      hospitalResponseNote: claims.hospitalResponseNote,
      hospitalRespondedAt: claims.hospitalRespondedAt,
      decisionNote: claims.decisionNote,
      escalatedToPkjkn: claims.escalatedToPkjkn,
    })
    .from(claims)
    .innerJoin(hospitals, eq(claims.hospitalId, hospitals.id))
    .innerJoin(doctors, eq(claims.doctorId, doctors.id))
    .where(whereClause)
    .orderBy(desc(claims.updatedAt), desc(claims.admissionDate))
    .limit(filters.limit)
    .offset(offset)

  const pageClaimIds = rows.map((r) => r.id)
  const logsByClaim = new Map<
    string,
    Array<{
      fromStatus: string | null
      toStatus: string | null
      note: string | null
    }>
  >()

  if (pageClaimIds.length > 0) {
    const auditRows = await db
      .select({
        entityId: auditLogs.entityId,
        fromStatus: auditLogs.fromStatus,
        toStatus: auditLogs.toStatus,
        note: auditLogs.note,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, 'claim'),
          inArray(auditLogs.entityId, pageClaimIds),
        ),
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageClaimIds.length * 6)

    for (const log of auditRows) {
      const list = logsByClaim.get(log.entityId) ?? []
      list.push(log)
      logsByClaim.set(log.entityId, list)
    }
  }

  const items: ClaimHistoryItem[] = rows.map((row) => {
    const logs = logsByClaim.get(row.id) ?? []
    const latestLog = logs.at(0)
    const clarificationLog = logs.find(
      (entry) => entry.toStatus === 'klarifikasi',
    )
    const isNeedFinal =
      row.status === 'klarifikasi' || row.status === 'balasan_rs'
    const hasClarificationContext = Boolean(
      clarificationLog ||
        row.clarificationRequestedAt ||
        row.hospitalResponseNote,
    )

    return {
      id: row.id,
      noSep: row.noSep,
      admissionDate: row.admissionDate,
      eventTimestampIso: (row.verifiedAt ?? row.updatedAt).toISOString(),
      patientAlias: row.patientAlias,
      patientGender: row.patientGender,
      patientAge: row.patientAge,
      inacbgCode: row.inacbgCode,
      inacbgDescription: row.inacbgDescription,
      hospitalId: row.hospitalId,
      hospitalName: row.hospitalName,
      facilityType: row.facilityType,
      doctorName: row.doctorName,
      tariffIdr: row.tariffIdr,
      revisedTariffIdr: row.revisedTariffIdr,
      riskScore: row.riskScore,
      fraudTypology: row.fraudTypology,
      status: row.status,
      fromStatusLabel: resolveFromStatusLabel({
        currentStatus: row.status,
        latestFromStatus: latestLog?.fromStatus ?? null,
        riskScore: row.riskScore,
        hasClarificationContext,
      }),
      isNeedFinal,
      initialClarificationNote:
        clarificationLog?.note ??
        (hasClarificationContext ? row.signalSummary : null),
      clarificationRequestedAt: row.clarificationRequestedAt,
      hospitalResponseNote: row.hospitalResponseNote,
      hospitalRespondedAt: row.hospitalRespondedAt,
      decisionNote: row.decisionNote,
      escalatedToPkjkn: row.escalatedToPkjkn,
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
      totalCount: Number(summaryRow.totalCount),
      needFinalCount: Number(summaryRow.needFinalCount),
      finalizedCount: Number(summaryRow.finalizedCount),
      approvedCount: Number(summaryRow.approvedCount),
      approvedAmountIdr: Number(summaryRow.approvedAmountIdr),
      falsePositiveCount: Number(summaryRow.falsePositiveCount),
      pendingRsCount: Number(summaryRow.pendingRsCount),
      rejectedCount: Number(summaryRow.rejectedCount),
      rejectedSavingsIdr: Number(summaryRow.rejectedSavingsIdr),
    },
    hospitals: hospitalRows,
    periods,
  }
}
