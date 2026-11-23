import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// 1. Pelacakan kuota bulanan R2 (Zero-Cost 95% Circuit Breaker — BLUEPRINT.md §4)
export const storageUsage = sqliteTable('storage_usage', {
  month: text('month').primaryKey(), // Format: "YYYY-MM"
  classA: integer('class_a').notNull().default(0),
  classB: integer('class_b').notNull().default(0),
  totalBytes: integer('total_bytes').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// 2. Katalog file Private R2 (pengganti R2.list() agar hemat kuota Class A)
export const mediaFiles = sqliteTable(
  'media_files',
  {
    id: text('id').primaryKey(), // UUID v4
    objectKey: text('object_key').notNull().unique(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    uploadedBy: text('uploaded_by').notNull(),
    entityType: text('entity_type', {
      enum: ['claim', 'cluster', 'pks'],
    }).notNull(),
    entityId: text('entity_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_media_uploaded_by').on(table.uploadedBy),
    index('idx_media_entity').on(table.entityType, table.entityId),
  ],
)

// 3. Persona & RBAC pengguna BPJS (Mas Rian, Ibu Anita, Pak Rudi)
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    role: text('role', {
      enum: ['verifikator', 'auditor_wilayah', 'kepala_cabang'],
    }).notNull(),
    unitName: text('unit_name').notNull(), // "KC Malang" | "Divre Jatim"
    branchCode: text('branch_code').notNull(), // "KC-MLG" | "DIVRE-JTM"
    title: text('title').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('idx_users_role').on(table.role)],
)

// 4. FKRTL Mitra (12 RS KC Malang + Faskes Lintas Cabang Divre Jatim)
export const hospitals = sqliteTable(
  'hospitals',
  {
    id: text('id').primaryKey(), // Kode faskes BPJS, misal "0195R008"
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    facilityType: text('facility_type', {
      enum: ['A', 'B', 'C', 'D', 'Klinik'],
    }).notNull(),
    branchCode: text('branch_code').notNull(), // "KC-MLG" | "KC-SBY" | "KC-JBR" | "KC-KDR"
    directorName: text('director_name').notNull(),
    bedCapacity: integer('bed_capacity').notNull(), // Kapasitas TT resmi Aplicares
    borTotalPct: real('bor_total_pct').notNull().default(0),
    borCardioVipPct: real('bor_cardio_vip_pct').notNull().default(0),
    complianceScore: integer('compliance_score').notNull().default(100), // 0-100
    complianceGrade: text('compliance_grade', {
      enum: ['A', 'B', 'C', 'D'],
    }).notNull(),
    pilarBorScore: integer('pilar_bor_score').notNull().default(100),
    pilarCodingScore: integer('pilar_coding_score').notNull().default(100),
    pilarFastTrackPct: real('pilar_fast_track_pct').notNull().default(100),
    pilarResponseScore: integer('pilar_response_score').notNull().default(100),
    tgrBurdenIdr: integer('tgr_burden_idr').notNull().default(0),
    pksExpiresAt: text('pks_expires_at').notNull(), // ISO date YYYY-MM-DD
    pksStatus: text('pks_status', {
      enum: [
        'aktif',
        'evaluasi_pks',
        'pks_bersyarat',
        'teguran_sp1',
        'pembinaan',
        'diperpanjang',
      ],
    })
      .notNull()
      .default('aktif'),
    pksEofficeNumber: text('pks_eoffice_number'),
    dominantTypology: text('dominant_typology'),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_hospitals_branch').on(table.branchCode),
    index('idx_hospitals_pks_status').on(table.pksStatus),
    index('idx_hospitals_compliance_score').on(table.complianceScore),
  ],
)

// 5. Dokter DPJP (pelacakan rasio tindakan ulang & Trigger #3 >= 5 penolakan)
export const doctors = sqliteTable(
  'doctors',
  {
    id: text('id').primaryKey(), // Misal "SP-JNT-088"
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    specialty: text('specialty').notNull(),
    primaryHospitalId: text('primary_hospital_id')
      .notNull()
      .references(() => hospitals.id),
    practiceFacilityCount: integer('practice_facility_count')
      .notNull()
      .default(1),
    repeatProcedureRatioPct: real('repeat_procedure_ratio_pct')
      .notNull()
      .default(0),
    peerAvgRatioPct: real('peer_avg_ratio_pct').notNull().default(6),
    consecutiveRejections: integer('consecutive_rejections')
      .notNull()
      .default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index('idx_doctors_hospital').on(table.primaryHospitalId)],
)

// 6. Berkas Klaim SEP (ketat UU PDP No. 27/2022: tanpa nama asli / NIK mentah)
export const claims = sqliteTable(
  'claims',
  {
    id: text('id').primaryKey(),
    noSep: text('no_sep').notNull().unique(), // 19 digit SEP
    patientAlias: text('patient_alias').notNull(), // Contoh: "Pasien #B-9021"
    patientCardHash: text('patient_card_hash').notNull(), // Salted SHA-256
    patientNikMasked: text('patient_nik_masked').notNull(), // "357301******0003"
    patientGender: text('patient_gender', { enum: ['L', 'P'] }).notNull(),
    patientAge: integer('patient_age').notNull(),
    admissionDate: text('admission_date').notNull(), // ISO YYYY-MM-DD
    dischargeDate: text('discharge_date').notNull(),
    losDays: integer('los_days').notNull(),
    serviceType: text('service_type', {
      enum: ['rawat_inap', 'rawat_jalan'],
    }).notNull(),
    careClass: integer('care_class').notNull(), // 1 | 2 | 3
    hospitalId: text('hospital_id')
      .notNull()
      .references(() => hospitals.id),
    referringFacility: text('referring_facility').notNull(),
    doctorId: text('doctor_id')
      .notNull()
      .references(() => doctors.id),
    icd10Primary: text('icd10_primary').notNull(),
    icd10SecondaryJson: text('icd10_secondary_json').notNull().default('[]'),
    icd9ProceduresJson: text('icd9_procedures_json').notNull().default('[]'),
    inacbgCode: text('inacbg_code').notNull(),
    inacbgDescription: text('inacbg_description').notNull(),
    tariffIdr: integer('tariff_idr').notNull(),
    peerAvgTariffIdr: integer('peer_avg_tariff_idr').notNull(),
    hospitalRealCostIdr: integer('hospital_real_cost_idr').notNull(),

    // Mesin Penilaian Deterministik 3 Lapis (0 token LLM)
    scoreMedical: integer('score_medical').notNull(), // Bobot 40%
    scoreStatistical: integer('score_statistical').notNull(), // Bobot 35%
    scoreNetwork: integer('score_network').notNull(), // Bobot 25%
    riskScore: integer('risk_score').notNull(), // 0-100 komposit
    riskZone: text('risk_zone', {
      enum: ['hijau', 'kuning', 'merah'],
    }).notNull(),
    fraudTypology: text('fraud_typology', {
      enum: [
        'none',
        'repeat_billing',
        'phantom_billing',
        'upcoding',
        'unbundling',
        'self_referral',
      ],
    })
      .notNull()
      .default('none'),
    signalSummary: text('signal_summary').notNull(),
    evidenceJson: text('evidence_json').notNull().default('{}'),

    // State Machine Keputusan Verifikator (Human-in-the-Loop)
    status: text('status', {
      enum: [
        'belum_dicek',
        'klarifikasi',
        'balasan_rs',
        'pending_rs',
        'disetujui',
        'false_positive',
        'ditolak',
      ],
    })
      .notNull()
      .default('belum_dicek'),
    slaDueAt: text('sla_due_at').notNull(),
    clarificationRequestedAt: text('clarification_requested_at'),
    hospitalResponseNote: text('hospital_response_note'),
    hospitalRespondedAt: text('hospital_responded_at'),
    aiNarrativeCache: text('ai_narrative_cache'),
    aiDraftCache: text('ai_draft_cache'),
    escalatedToPkjkn: integer('escalated_to_pkjkn', { mode: 'boolean' })
      .notNull()
      .default(false),
    verifiedBy: text('verified_by').references(() => users.id),
    verifiedAt: integer('verified_at', { mode: 'timestamp' }),
    decisionNote: text('decision_note'),
    revisedTariffIdr: integer('revised_tariff_idr'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_claims_status_score').on(table.status, table.riskScore),
    index('idx_claims_hospital_status').on(table.hospitalId, table.status),
    index('idx_claims_doctor_status').on(table.doctorId, table.status),
    index('idx_claims_zone').on(table.riskZone),
    index('idx_claims_typology').on(table.fraudTypology),
    index('idx_claims_sla').on(table.slaDueAt),
  ],
)

// 7. Kluster Eskalasi Wilayah (Lini 2 — Ibu Anita, Divre Jatim)
export const fraudClusters = sqliteTable(
  'fraud_clusters',
  {
    id: text('id').primaryKey(), // Misal "JTM-01"
    clusterCode: text('cluster_code').notNull().unique(), // "#JTM-01"
    title: text('title').notNull(),
    branchCode: text('branch_code').notNull(),
    primaryHospitalId: text('primary_hospital_id')
      .notNull()
      .references(() => hospitals.id),
    centralDoctorId: text('central_doctor_id').references(() => doctors.id),
    riskScore: integer('risk_score').notNull(),
    priorityLevel: text('priority_level', {
      enum: ['kritis', 'perhatian'],
    }).notNull(),
    fraudTypology: text('fraud_typology').notNull(),
    triggerReason: text('trigger_reason', {
      enum: [
        'cluster_frequency',
        'financial_exposure',
        'dpjp_outlier',
        'combined',
      ],
    }).notNull(),
    escalatedClaimCount: integer('escalated_claim_count').notNull().default(0),
    potentialLossIdr: integer('potential_loss_idr').notNull().default(0),
    agreedTgrIdr: integer('agreed_tgr_idr').notNull().default(0),
    graphPayloadJson: text('graph_payload_json').notNull().default('{}'),
    followupStage: text('followup_stage', {
      enum: [
        'baru',
        'sidak_fisik',
        'tagih_tgr',
        'evaluasi_pks',
        'limpah_aph',
        'arsip_wajar',
      ],
    })
      .notNull()
      .default('baru'),
    finalStatus: text('final_status', {
      enum: [
        'belum_final',
        'tagih_tgr',
        'kirim_pak_rudi',
        'proses_aph',
        'arsip_wajar',
      ],
    })
      .notNull()
      .default('belum_final'),
    fieldChecklistJson: text('field_checklist_json').notNull().default('{}'),
    auditResultNote: text('audit_result_note'),
    assignedAuditorId: text('assigned_auditor_id').references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_clusters_branch_priority').on(
      table.branchCode,
      table.priorityLevel,
    ),
    index('idx_clusters_hospital').on(table.primaryHospitalId),
    index('idx_clusters_stage').on(table.followupStage),
  ],
)

// 8. Keputusan Kebijakan & Kontrak PKS Tahunan (Lini 3 — Pak Rudi)
export const pksDecisions = sqliteTable(
  'pks_decisions',
  {
    id: text('id').primaryKey(),
    hospitalId: text('hospital_id')
      .notNull()
      .references(() => hospitals.id),
    clusterId: text('cluster_id').references(() => fraudClusters.id),
    evaluationPeriod: text('evaluation_period').notNull(), // "Q3 2026"
    recommendedPolicy: text('recommended_policy', {
      enum: ['pks_bersyarat', 'teguran_sp1', 'pembinaan', 'perpanjang'],
    }).notNull(),
    finalPolicy: text('final_policy'),
    tgrCommitmentIdr: integer('tgr_commitment_idr').notNull().default(0),
    addendumRequirementsJson: text('addendum_requirements_json')
      .notNull()
      .default('[]'),
    meetingChecklistJson: text('meeting_checklist_json')
      .notNull()
      .default('{}'),
    eofficeRefNumber: text('eoffice_ref_number'),
    executiveNote: text('executive_note'),
    draftLetterCache: text('draft_letter_cache'),
    isLocked: integer('is_locked', { mode: 'boolean' })
      .notNull()
      .default(false),
    decidedBy: text('decided_by').references(() => users.id),
    decidedAt: integer('decided_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_pks_hospital').on(table.hospitalId),
    index('idx_pks_locked').on(table.isLocked),
  ],
)

// 9. Rekam Jejak Audit Permanen (Immutable Governance Audit Trail)
export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type', {
      enum: ['claim', 'cluster', 'pks_decision'],
    }).notNull(),
    entityId: text('entity_id').notNull(),
    action: text('action').notNull(),
    fromStatus: text('from_status'),
    toStatus: text('to_status'),
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id),
    actorRole: text('actor_role').notNull(),
    note: text('note'),
    metadataJson: text('metadata_json'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_audit_entity').on(table.entityType, table.entityId),
    index('idx_audit_created').on(table.createdAt),
    index('idx_audit_actor').on(table.actorId),
  ],
)
