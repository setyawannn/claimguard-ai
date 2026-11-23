import { desc, eq } from 'drizzle-orm'
import type { AppDatabase } from '#/db'
import { auditLogs, claims, doctors, fraudClusters, hospitals } from '#/db/schema'
import { formatIdrCompact, formatPercent } from '#/lib/format'
import {
  JATIM_BRANCHES,
  JATIM_BRANCH_NAME_MAP,
} from '#/lib/regional-branches'
import { FRAUD_TYPOLOGY_META } from '#/lib/status-tokens'
import type { FraudTypology } from '#/lib/status-tokens'
import type {
  ClusterInvestigationDetail,
  ClusterInvestigationResponse,
  ClusterStoryCard,
  ConstellationNodeInfo,
  GraphNodeKey,
  InvestigationBranchOption,
  InvestigationClaimSample,
  InvestigationClusterOption,
  InvestigationSearchInput,
  UpdateClusterStageInput,
  UpdateClusterStageResult,
} from '#/schemas/clusters.schema'
import type { SessionUser } from '#/schemas/session.schema'

function getTypologyLabel(typology: string): string {
  if (typology in FRAUD_TYPOLOGY_META) {
    return FRAUD_TYPOLOGY_META[typology as FraudTypology]
  }
  return typology
}

function mapStageToFinalStatus(
  stage: UpdateClusterStageInput['followupStage'],
): UpdateClusterStageResult['finalStatus'] {
  if (stage === 'tagih_tgr') return 'tagih_tgr'
  if (stage === 'evaluasi_pks') return 'kirim_pak_rudi'
  if (stage === 'limpah_aph') return 'proses_aph'
  if (stage === 'arsip_wajar') return 'arsip_wajar'
  return 'belum_final'
}

function buildConstellationPayload(args: {
  id: string
  clusterCode: string
  title: string
  branchCode: string
  branchName: string
  hospitalId: string
  hospitalName: string
  facilityType: string
  borTotalPct: number
  borCardioVipPct: number
  bedCapacity: number
  doctorName: string
  doctorSpecialty: string
  practiceFacilityCount: number
  riskScore: number
  priorityLevel: 'kritis' | 'perhatian'
  fraudTypology: string
  escalatedClaimCount: number
  potentialLossIdr: number
  followupStage: ClusterInvestigationDetail['followupStage']
  auditResultNote: string | null
  samples: InvestigationClaimSample[]
}): ClusterInvestigationDetail {
  const uniqueReferrers = Array.from(
    new Set(args.samples.map((s) => s.referringFacility).filter(Boolean)),
  )
  const primaryReferrer =
    uniqueReferrers[0] ??
    (args.id === 'JTM-01' ? 'RS Prima Husada (Tipe C)' : `FKTP Jejaring ${args.branchName}`)
  const secondaryPractice =
    uniqueReferrers[1] ??
    (args.id === 'JTM-01'
      ? 'Klinik Jantung Utama'
      : `Klinik Utama Mitra ${args.branchName}`)

  const primaryCount = Math.max(1, Math.round(args.escalatedClaimCount * 0.64))
  const secondaryCount = Math.max(1, args.escalatedClaimCount - primaryCount)
  const compactLoss = formatIdrCompact(args.potentialLossIdr)
  const effectiveBor = Math.max(args.borTotalPct, args.borCardioVipPct)
  const borLabel = formatPercent(effectiveBor)
  const typologyText = getTypologyLabel(args.fraudTypology)
  const samplePreview =
    args.samples.length > 0
      ? args.samples
          .slice(0, 2)
          .map((s) => `${s.patientAlias.replace('Pasien ', '')}`)
          .join(', ') +
        (args.escalatedClaimCount > 2
          ? `, +${args.escalatedClaimCount - 2} Lainnya`
          : '')
      : `${args.escalatedClaimCount} Pasien Terdampak`

  const sepPreview =
    args.samples.length > 0
      ? args.samples
          .slice(0, 2)
          .map(
            (s) =>
              `SEP ...${s.noSep.slice(-4)} (${s.patientAlias.replace('Pasien ', '')})`,
          )
          .join(', ')
      : `${args.escalatedClaimCount} Berkas SEP Terarsip`

  const actionUnit =
    args.samples[0]?.inacbgDescription ??
    (args.fraudTypology === 'repeat_billing' ? 'Kateterisasi PCI' : typologyText)

  const nodes: Record<GraphNodeKey, ConstellationNodeInfo> = {
    referring_hospital: {
      key: 'referring_hospital',
      overline: 'SIMPUL DIKLIK · FASKES PERUJUK',
      badgeLabel: `${primaryCount} Rujukan`,
      badgeTone: 'medium',
      title: primaryReferrer,
      subtitle: `Faskes Perujuk Awal · Wilayah ${args.branchName}`,
      canvasTag: 'FASKES PERUJUK',
      canvasTitle: primaryReferrer,
      canvasMeta: `${primaryCount} Pasien Terkait · Lunas Awal`,
      inboundText: `Masuk: Kunjungan awal ${primaryCount} peserta JKN sebelum dirujuk`,
      outboundText: `Keluar: ${primaryCount} rujukan terpola ke ${args.doctorName} & ${args.hospitalName}`,
      findingText: `Ditemukan konsentrasi rujukan non-emergensi dari ${primaryReferrer} ke ${args.hospitalName} dengan pola DPJP tujuan yang identik dalam periode 11–14 hari.`,
      documents: [
        {
          id: 'doc-ref-summary',
          title: `Rekap Surat Rujukan ${primaryReferrer}`,
          subtitle: 'Dokumen Cetak · Daftar tanggal rujukan awal',
          actionType: 'print',
          docType: 'referring_summary',
        },
        {
          id: 'doc-ref-csv',
          title: 'Tabel Kronologi Pasien Lintas RS (.CSV)',
          subtitle: 'CSV · Perbandingan tanggal rujukan & rawat inap',
          actionType: 'csv',
        },
      ],
    },
    clinic_practice: {
      key: 'clinic_practice',
      overline: 'SIMPUL DIKLIK · PRAKTIK SORE DPJP',
      badgeLabel: `${secondaryCount} Pasien`,
      badgeTone: 'primary',
      title: secondaryPractice,
      subtitle: `Jejaring Praktik ${args.doctorName}`,
      canvasTag: 'PRAKTIK SORE DPJP',
      canvasTitle: secondaryPractice,
      canvasMeta: `${secondaryCount} Pasien Rujukan Keluar`,
      inboundText: `Masuk: ${secondaryCount} pasien konsultasi rawat jalan di ${secondaryPractice}`,
      outboundText: `Keluar: Diarahkan ke rawat inap / tindakan ${actionUnit} di ${args.hospitalName}`,
      findingText: `Teridentifikasi pola peralihan pasien dari praktik luar ke ruang tindakan ${args.hospitalName} dengan penagihan klaim penuh tanpa jeda klinis wajar.`,
      documents: [
        {
          id: 'doc-clinic-schedule',
          title: `Rekap Jadwal & Klaim ${args.doctorName}`,
          subtitle: `Dokumen Cetak · Riwayat praktik ${args.practiceFacilityCount} Faskes`,
          actionType: 'print',
          docType: 'dpjp_schedule',
        },
        {
          id: 'doc-clinic-draft',
          title: 'Draft Nota Dinas Klarifikasi Jejaring',
          subtitle: 'Siap salin ke e-Office wilayah',
          actionType: 'copy',
        },
      ],
    },
    dpjp_hub: {
      key: 'dpjp_hub',
      overline: 'SIMPUL DIKLIK · OKNUM DPJP HUB',
      badgeLabel: `Skor ${args.riskScore}`,
      badgeTone: args.riskScore >= 70 ? 'high' : 'medium',
      title: args.doctorName,
      subtitle: `Penghubung ${args.practiceFacilityCount} Faskes (${args.doctorSpecialty})`,
      canvasTag: 'DPJP HUB',
      canvasTitle: args.doctorName,
      canvasMeta: `Praktik di ${args.practiceFacilityCount} Faskes · ${args.escalatedClaimCount} Klaim`,
      inboundText: `Masuk: ${args.escalatedClaimCount} Pasien dari ${primaryReferrer} (${primaryCount}) & ${secondaryPractice} (${secondaryCount})`,
      outboundText: `Keluar: ${args.escalatedClaimCount} Klaim ${typologyText} (${compactLoss}) ke ${args.hospitalName}`,
      findingText:
        args.auditResultNote ??
        `Mengulang tindakan ${actionUnit} dalam rentang singkat dengan rasio jauh di atas rata-rata peer group cabang.`,
      documents: [
        {
          id: 'doc-dpjp-draft',
          title: 'Draft Nota Dinas & SPT Sidak',
          subtitle: 'Siap salin ke e-Office wilayah',
          actionType: 'copy',
        },
        {
          id: 'doc-dpjp-schedule',
          title: `Rekap Jadwal & Klaim ${args.doctorName}`,
          subtitle: `Dokumen Cetak · Riwayat praktik ${args.practiceFacilityCount} Faskes`,
          actionType: 'print',
          docType: 'dpjp_schedule',
        },
      ],
    },
    billing_hospital: {
      key: 'billing_hospital',
      overline: 'SIMPUL DIKLIK · FASKES PENAGIH',
      badgeLabel: `BOR ${borLabel}`,
      badgeTone: effectiveBor >= 95 ? 'high' : 'medium',
      title: `${args.hospitalName} (Tipe ${args.facilityType})`,
      subtitle: `Faskes Penagih · ${args.escalatedClaimCount} Berkas Ditolak Cabang`,
      canvasTag: 'FASKES PENAGIH UTAMA',
      canvasTitle: `${args.hospitalName} (Tipe ${args.facilityType})`,
      canvasMeta: `BOR ${borLabel} · ${args.escalatedClaimCount} Klaim Terindikasi`,
      inboundText: `Masuk: ${args.escalatedClaimCount} Klaim ${actionUnit} dari ${args.doctorName} (${compactLoss})`,
      outboundText: `Keluar: Rujuk balik kontrol ke ${primaryReferrer}`,
      findingText: `Kapasitas tempat tidur resmi ${args.bedCapacity} TT mencatat okupansi ${borLabel}. Diperlukan verifikasi fisik CCTV layanan, buku register ruangan, dan kesesuaian tenaga jaga.`,
      documents: [
        {
          id: 'doc-hosp-checklist',
          title: 'Checklist Sidak CCTV & Buku Register',
          subtitle: 'Dokumen Cetak · Siap cetak tim lapangan',
          actionType: 'print',
          docType: 'sidak_checklist',
        },
        {
          id: 'doc-hosp-pks',
          title: 'Draft Evaluasi PKS & Surat Teguran',
          subtitle: 'Siap salin ke Nota Dinas Cabang',
          actionType: 'copy',
        },
      ],
    },
    sep_cluster: {
      key: 'sep_cluster',
      overline: 'SIMPUL DIKLIK · KLUSTER PASIEN & SEP',
      badgeLabel: `${args.escalatedClaimCount} Berkas`,
      badgeTone: 'high',
      title: `Kluster ${args.escalatedClaimCount} Pasien & Berkas SEP`,
      subtitle: `Bukti Eskalasi Verifikator ${args.branchName}`,
      canvasTag: 'KLUSTER PASIEN & SEP',
      canvasTitle: `${args.escalatedClaimCount} Berkas SEP Eskalasi`,
      canvasMeta: samplePreview,
      inboundText: `Berasal dari: Penolakan klaim di ${args.hospitalName}`,
      outboundText: `Sampel: ${sepPreview}`,
      findingText: `Seluruh ${args.escalatedClaimCount} berkas (${compactLoss}) memiliki pola ${typologyText} yang terkonfirmasi melampaui ambang eskalasi 30 hari cabang.`,
      documents: [
        {
          id: 'doc-sep-bundle',
          title: `Bundel Lengkap ${args.escalatedClaimCount} SEP & Catatan Cabang`,
          subtitle: 'Dokumen Cetak · Lampiran audit PK-JKN',
          actionType: 'print',
          docType: 'sep_bundle',
        },
        {
          id: 'doc-sep-csv',
          title: 'Tabel Kronologi Pasien Lintas RS (.CSV)',
          subtitle: 'CSV · Perbandingan tanggal antar-RS',
          actionType: 'csv',
        },
      ],
    },
  }

  const storyCards: ClusterStoryCard[] = [
    {
      step: '1. HULU: PENGUMPULAN RUJUKAN',
      title: '1. HULU: PENGUMPULAN RUJUKAN',
      description: `${primaryCount} pasien dari ${primaryReferrer} & ${secondaryCount} dari ${secondaryPractice} diarahkan melalui ${args.doctorName}.`,
      tone: 'primary',
    },
    {
      step: '2. TENGAH: POLA ANOMALI KLAIM',
      title: `2. TENGAH: ${typologyText.toUpperCase()}`,
      description: `${args.escalatedClaimCount} berkas ${actionUnit} (${compactLoss}) menunjukkan indikasi ${typologyText.toLowerCase()} di luar kewajaran klinis.`,
      tone: 'high',
    },
    {
      step: '3. HILIR: OVER-CAPACITY & ESKALASI',
      title: '3. HILIR: OVER-CAPACITY & ESKALASI',
      description: `Okupansi ${args.hospitalName} tercatat ${borLabel} dari ${args.bedCapacity} TT; kluster dieskalasikan ke Divre Jatim.`,
      tone: 'medium',
    },
  ]

  return {
    id: args.id,
    clusterCode: args.clusterCode,
    title: args.title,
    branchCode: args.branchCode,
    branchName: args.branchName,
    hospitalId: args.hospitalId,
    hospitalName: args.hospitalName,
    facilityType: args.facilityType,
    borTotalPct: args.borTotalPct,
    borCardioVipPct: args.borCardioVipPct,
    bedCapacity: args.bedCapacity,
    doctorName: args.doctorName,
    doctorSpecialty: args.doctorSpecialty,
    practiceFacilityCount: args.practiceFacilityCount,
    riskScore: args.riskScore,
    priorityLevel: args.priorityLevel,
    fraudTypology: args.fraudTypology,
    escalatedClaimCount: args.escalatedClaimCount,
    potentialLossIdr: args.potentialLossIdr,
    followupStage: args.followupStage,
    auditResultNote: args.auditResultNote,
    edgeLabels: {
      referToHub:
        args.fraudTypology === 'repeat_billing'
          ? '1. Rujuk Dini (11–14 Hr)'
          : '1. Pengumpulan Rujukan',
      hubToBilling: `2. ${args.escalatedClaimCount} Klaim · ${compactLoss}`,
      billingToCluster: '3. Ditolak Cabang',
      circularReturn: '4. Siklus Rujuk Balik (Sirkular)',
    },
    nodes,
    storyCards,
    claimSamples: args.samples,
  }
}

export async function getClusterInvestigation(
  db: AppDatabase,
  params: InvestigationSearchInput,
): Promise<ClusterInvestigationResponse> {
  const rows = await db
    .select({
      id: fraudClusters.id,
      clusterCode: fraudClusters.clusterCode,
      title: fraudClusters.title,
      branchCode: fraudClusters.branchCode,
      hospitalId: hospitals.id,
      hospitalName: hospitals.name,
      facilityType: hospitals.facilityType,
      borTotalPct: hospitals.borTotalPct,
      borCardioVipPct: hospitals.borCardioVipPct,
      bedCapacity: hospitals.bedCapacity,
      doctorName: doctors.name,
      doctorSpecialty: doctors.specialty,
      practiceFacilityCount: doctors.practiceFacilityCount,
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

  const branches: InvestigationBranchOption[] = JATIM_BRANCHES.map((b) => ({
    branchCode: b.code,
    branchName: b.name,
    clusterCount: rows.filter((r) => r.branchCode === b.code).length,
  }))

  const allClusters: InvestigationClusterOption[] = rows.map((r) => ({
    id: r.id,
    clusterCode: r.clusterCode,
    title: r.title,
    branchCode: r.branchCode,
    branchName: JATIM_BRANCH_NAME_MAP.get(r.branchCode) ?? r.branchCode,
    hospitalName: r.hospitalName,
    riskScore: r.riskScore,
    priorityLevel: r.priorityLevel,
    followupStage: r.followupStage,
    potentialLossIdr: r.potentialLossIdr,
    escalatedClaimCount: r.escalatedClaimCount,
  }))

  const clusterOptions = params.branchCode
    ? allClusters.filter((c) => c.branchCode === params.branchCode)
    : allClusters

  const activeRow =
    (params.clusterId
      ? rows.find((r) => r.id === params.clusterId)
      : undefined) ??
    (params.branchCode
      ? rows.find((r) => r.branchCode === params.branchCode)
      : undefined) ??
    rows.at(0)

  if (!activeRow) {
    return {
      activeCluster: null,
      clusterOptions,
      branches,
      allClusters,
    }
  }

  const claimRows = await db
    .select({
      id: claims.id,
      noSep: claims.noSep,
      patientAlias: claims.patientAlias,
      admissionDate: claims.admissionDate,
      dischargeDate: claims.dischargeDate,
      inacbgCode: claims.inacbgCode,
      inacbgDescription: claims.inacbgDescription,
      referringFacility: claims.referringFacility,
      tariffIdr: claims.tariffIdr,
      riskScore: claims.riskScore,
      status: claims.status,
    })
    .from(claims)
    .where(eq(claims.hospitalId, activeRow.hospitalId))
    .orderBy(desc(claims.riskScore), desc(claims.admissionDate))
    .limit(14)

  const activeCluster = buildConstellationPayload({
    id: activeRow.id,
    clusterCode: activeRow.clusterCode,
    title: activeRow.title,
    branchCode: activeRow.branchCode,
    branchName: JATIM_BRANCH_NAME_MAP.get(activeRow.branchCode) ?? activeRow.branchCode,
    hospitalId: activeRow.hospitalId,
    hospitalName: activeRow.hospitalName,
    facilityType: activeRow.facilityType,
    borTotalPct: activeRow.borTotalPct,
    borCardioVipPct: activeRow.borCardioVipPct,
    bedCapacity: activeRow.bedCapacity,
    doctorName: activeRow.doctorName ?? 'Tim DPJP Terkait',
    doctorSpecialty: activeRow.doctorSpecialty ?? 'Spesialis Terkait',
    practiceFacilityCount: activeRow.practiceFacilityCount ?? 2,
    riskScore: activeRow.riskScore,
    priorityLevel: activeRow.priorityLevel,
    fraudTypology: activeRow.fraudTypology,
    escalatedClaimCount: activeRow.escalatedClaimCount,
    potentialLossIdr: activeRow.potentialLossIdr,
    followupStage: activeRow.followupStage,
    auditResultNote: activeRow.auditResultNote,
    samples: claimRows,
  })

  return {
    activeCluster,
    clusterOptions,
    branches,
    allClusters,
  }
}

export async function updateClusterStage(
  db: AppDatabase,
  actor: SessionUser,
  input: UpdateClusterStageInput,
): Promise<UpdateClusterStageResult> {
  const existing = await db
    .select({
      id: fraudClusters.id,
      clusterCode: fraudClusters.clusterCode,
      followupStage: fraudClusters.followupStage,
      primaryHospitalId: fraudClusters.primaryHospitalId,
      potentialLossIdr: fraudClusters.potentialLossIdr,
    })
    .from(fraudClusters)
    .where(eq(fraudClusters.id, input.clusterId))
    .limit(1)

  const cluster = existing.at(0)
  if (!cluster) {
    throw new Error('Kluster investigasi tidak ditemukan di basis data.')
  }

  const now = new Date()
  const finalStatus = mapStageToFinalStatus(input.followupStage)

  await db.batch([
    db
      .update(fraudClusters)
      .set({
        followupStage: input.followupStage,
        finalStatus,
        auditResultNote: input.note,
        assignedAuditorId: actor.id,
        updatedAt: now,
      })
      .where(eq(fraudClusters.id, cluster.id)),
    db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      entityType: 'cluster',
      entityId: cluster.id,
      action: `cluster_stage_${input.followupStage}`,
      fromStatus: cluster.followupStage,
      toStatus: input.followupStage,
      actorId: actor.id,
      actorRole: actor.role,
      note: input.note,
      metadataJson: JSON.stringify({
        clusterCode: cluster.clusterCode,
        finalStatus,
        potentialLossIdr: cluster.potentialLossIdr,
      }),
    }),
    ...(input.followupStage === 'evaluasi_pks'
      ? [
          db
            .update(hospitals)
            .set({ pksStatus: 'evaluasi_pks', updatedAt: now })
            .where(eq(hospitals.id, cluster.primaryHospitalId)),
        ]
      : []),
  ])

  return {
    clusterId: cluster.id,
    clusterCode: cluster.clusterCode,
    followupStage: input.followupStage,
    finalStatus,
  }
}
