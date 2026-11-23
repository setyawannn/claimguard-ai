import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface RegionalHospitalSeed {
  id: string
  code: string
  name: string
  facilityType: 'A' | 'B' | 'C' | 'D' | 'Klinik'
  branchCode: string
  directorName: string
  bedCapacity: number
  borTotalPct: number
  borCardioVipPct: number
  complianceScore: number
  complianceGrade: 'A' | 'B' | 'C' | 'D'
  pilarBorScore: number
  pilarCodingScore: number
  pilarFastTrackPct: number
  pilarResponseScore: number
  tgrBurdenIdr: number
  pksExpiresAt: string
  pksStatus: 'aktif' | 'evaluasi_pks' | 'pks_bersyarat' | 'teguran_sp1' | 'pembinaan'
  dominantTypology: string
}

interface RegionalDoctorSeed {
  id: string
  code: string
  name: string
  specialty: string
  primaryHospitalId: string
  practiceFacilityCount: number
  repeatProcedureRatioPct: number
  peerAvgRatioPct: number
  consecutiveRejections: number
}

interface ClusterSeed {
  id: string
  clusterCode: string
  title: string
  branchCode: string
  primaryHospitalId: string
  centralDoctorId: string
  riskScore: number
  priorityLevel: 'kritis' | 'perhatian'
  fraudTypology:
    | 'repeat_billing'
    | 'phantom_billing'
    | 'upcoding'
    | 'unbundling'
    | 'self_referral'
  triggerReason:
    | 'cluster_frequency'
    | 'financial_exposure'
    | 'dpjp_outlier'
    | 'combined'
  escalatedClaimCount: number
  potentialLossIdr: number
  agreedTgrIdr: number
  followupStage:
    | 'baru'
    | 'sidak_fisik'
    | 'tagih_tgr'
    | 'evaluasi_pks'
    | 'limpah_aph'
    | 'arsip_wajar'
  finalStatus:
    | 'belum_final'
    | 'tagih_tgr'
    | 'kirim_pak_rudi'
    | 'proses_aph'
    | 'arsip_wajar'
  auditResultNote: string
}

const REGIONAL_HOSPITALS: readonly RegionalHospitalSeed[] = [
  {
    id: '0201R001',
    code: '0201R001',
    name: 'RS Mitra Sehat Surabaya',
    facilityType: 'B',
    branchCode: 'KC-SBY',
    directorName: 'dr. Adi Nugroho, MARS',
    bedCapacity: 260,
    borTotalPct: 91.5,
    borCardioVipPct: 96.2,
    complianceScore: 59,
    complianceGrade: 'C',
    pilarBorScore: 60,
    pilarCodingScore: 52,
    pilarFastTrackPct: 68.4,
    pilarResponseScore: 56,
    tgrBurdenIdr: 310_000_000,
    pksExpiresAt: '2027-03-31',
    pksStatus: 'evaluasi_pks',
    dominantTypology: 'Upcoding Sesar Level III',
  },
  {
    id: '0201R004',
    code: '0201R004',
    name: 'RS Graha Husada Surabaya',
    facilityType: 'B',
    branchCode: 'KC-SBY',
    directorName: 'dr. Ratna Kusuma, Sp.PK',
    bedCapacity: 220,
    borTotalPct: 87.2,
    borCardioVipPct: 94.0,
    complianceScore: 72,
    complianceGrade: 'B',
    pilarBorScore: 74,
    pilarCodingScore: 70,
    pilarFastTrackPct: 76.5,
    pilarResponseScore: 69,
    tgrBurdenIdr: 140_000_000,
    pksExpiresAt: '2027-06-30',
    pksStatus: 'pembinaan',
    dominantTypology: 'Repeat Billing Kardiologi',
  },
  {
    id: '0205R003',
    code: '0205R003',
    name: 'RS Citra Husada Jember',
    facilityType: 'C',
    branchCode: 'KC-JBR',
    directorName: 'dr. Bambang Sutrisno, M.Kes',
    bedCapacity: 150,
    borTotalPct: 88.8,
    borCardioVipPct: 85.4,
    complianceScore: 67,
    complianceGrade: 'C',
    pilarBorScore: 68,
    pilarCodingScore: 65,
    pilarFastTrackPct: 74.0,
    pilarResponseScore: 61,
    tgrBurdenIdr: 115_000_000,
    pksExpiresAt: '2027-05-15',
    pksStatus: 'pembinaan',
    dominantTypology: 'Readmisi Dini Rawat Inap',
  },
  {
    id: '0208R002',
    code: '0208R002',
    name: 'RS Baptis Kediri',
    facilityType: 'B',
    branchCode: 'KC-KDR',
    directorName: 'dr. Yohanes Santoso, MARS',
    bedCapacity: 210,
    borTotalPct: 78.4,
    borCardioVipPct: 79.0,
    complianceScore: 86,
    complianceGrade: 'B',
    pilarBorScore: 88,
    pilarCodingScore: 85,
    pilarFastTrackPct: 89.2,
    pilarResponseScore: 84,
    tgrBurdenIdr: 45_000_000,
    pksExpiresAt: '2027-09-30',
    pksStatus: 'aktif',
    dominantTypology: 'Unbundling Tindakan Minor',
  },
]

const REGIONAL_DOCTORS: readonly RegionalDoctorSeed[] = [
  {
    id: 'SP-OG-201',
    code: 'SP-OG-201',
    name: 'dr. Dewi Kartika, Sp.OG',
    specialty: 'Obstetri & Ginekologi',
    primaryHospitalId: '0201R001',
    practiceFacilityCount: 2,
    repeatProcedureRatioPct: 24.5,
    peerAvgRatioPct: 8.0,
    consecutiveRejections: 6,
  },
  {
    id: 'SP-JNT-204',
    code: 'SP-JNT-204',
    name: 'dr. Fajar Pratama, Sp.JP',
    specialty: 'Kardiologi Intervensi',
    primaryHospitalId: '0201R004',
    practiceFacilityCount: 3,
    repeatProcedureRatioPct: 28.1,
    peerAvgRatioPct: 7.4,
    consecutiveRejections: 5,
  },
  {
    id: 'SP-PD-209',
    code: 'SP-PD-209',
    name: 'dr. Teguh Wibowo, Sp.PD',
    specialty: 'Penyakit Dalam',
    primaryHospitalId: '0205R003',
    practiceFacilityCount: 2,
    repeatProcedureRatioPct: 19.2,
    peerAvgRatioPct: 6.5,
    consecutiveRejections: 4,
  },
  {
    id: 'SP-B-212',
    code: 'SP-B-212',
    name: 'dr. Arif Rahman, Sp.B',
    specialty: 'Bedah Umum',
    primaryHospitalId: '0208R002',
    practiceFacilityCount: 1,
    repeatProcedureRatioPct: 9.8,
    peerAvgRatioPct: 6.0,
    consecutiveRejections: 1,
  },
]

const CLUSTERS: readonly ClusterSeed[] = [
  {
    id: 'JTM-01',
    clusterCode: '#JTM-01',
    title: 'Kluster #JTM-01 · RSUD Medika & RS Prima',
    branchCode: 'KC-MLG',
    primaryHospitalId: '0195R008',
    centralDoctorId: 'SP-JNT-088',
    riskScore: 92,
    priorityLevel: 'kritis',
    fraudTypology: 'repeat_billing',
    triggerReason: 'combined',
    escalatedClaimCount: 14,
    potentialLossIdr: 640_000_000,
    agreedTgrIdr: 420_000_000,
    followupStage: 'baru',
    finalStatus: 'belum_final',
    auditResultNote:
      '14 klaim PCI ditolak cabang · Rujukan sirkular DPJP sama.',
  },
  {
    id: 'JTM-02',
    clusterCode: '#JTM-02',
    title: 'Kluster #JTM-02 · RS Hermosa Malang',
    branchCode: 'KC-MLG',
    primaryHospitalId: '0195R011',
    centralDoctorId: 'SP-PD-041',
    riskScore: 86,
    priorityLevel: 'kritis',
    fraudTypology: 'phantom_billing',
    triggerReason: 'financial_exposure',
    escalatedClaimCount: 12,
    potentialLossIdr: 485_000_000,
    agreedTgrIdr: 200_000_000,
    followupStage: 'baru',
    finalStatus: 'belum_final',
    auditResultNote:
      'Klaim rawat inap 118% kapasitas kasur · Phantom Billing.',
  },
  {
    id: 'JTM-03',
    clusterCode: '#JTM-03',
    title: 'Kluster #JTM-03 · RS Mitra Sehat Surabaya',
    branchCode: 'KC-SBY',
    primaryHospitalId: '0201R001',
    centralDoctorId: 'SP-OG-201',
    riskScore: 84,
    priorityLevel: 'kritis',
    fraudTypology: 'upcoding',
    triggerReason: 'cluster_frequency',
    escalatedClaimCount: 15,
    potentialLossIdr: 410_000_000,
    agreedTgrIdr: 0,
    followupStage: 'sidak_fisik',
    finalStatus: 'belum_final',
    auditResultNote:
      'Bukti eskalasi lengkap · Lonjakan Sesar Level III (84%).',
  },
  {
    id: 'JTM-04',
    clusterCode: '#JTM-04',
    title: 'Kluster #JTM-04 · RSIA Melati & Klinik Utama',
    branchCode: 'KC-MLG',
    primaryHospitalId: '0195R014',
    centralDoctorId: 'SP-OG-019',
    riskScore: 68,
    priorityLevel: 'perhatian',
    fraudTypology: 'unbundling',
    triggerReason: 'financial_exposure',
    escalatedClaimCount: 11,
    potentialLossIdr: 285_000_000,
    agreedTgrIdr: 0,
    followupStage: 'tagih_tgr',
    finalStatus: 'belum_final',
    auditResultNote:
      'Pola pemecahan tagihan obat (Unbundling) berulang.',
  },
  {
    id: 'JTM-05',
    clusterCode: '#JTM-05',
    title: 'Kluster #JTM-05 · RS Graha Husada Surabaya',
    branchCode: 'KC-SBY',
    primaryHospitalId: '0201R004',
    centralDoctorId: 'SP-JNT-204',
    riskScore: 81,
    priorityLevel: 'kritis',
    fraudTypology: 'self_referral',
    triggerReason: 'dpjp_outlier',
    escalatedClaimCount: 12,
    potentialLossIdr: 135_000_000,
    agreedTgrIdr: 0,
    followupStage: 'sidak_fisik',
    finalStatus: 'belum_final',
    auditResultNote:
      'Rujukan berantai klinik jejaring ke RS Graha Husada (5 penolakan DPJP).',
  },
  {
    id: 'JTM-06',
    clusterCode: '#JTM-06',
    title: 'Kluster #JTM-06 · RSUD Dr. Saiful Anwar',
    branchCode: 'KC-MLG',
    primaryHospitalId: '0112R001',
    centralDoctorId: 'SP-PD-012',
    riskScore: 54,
    priorityLevel: 'perhatian',
    fraudTypology: 'upcoding',
    triggerReason: 'financial_exposure',
    escalatedClaimCount: 8,
    potentialLossIdr: 65_000_000,
    agreedTgrIdr: 0,
    followupStage: 'tagih_tgr',
    finalStatus: 'belum_final',
    auditResultNote:
      'Audit koding komplikasi hemodialisis kelas I dalam pemantauan TGR.',
  },
  {
    id: 'JTM-07',
    clusterCode: '#JTM-07',
    title: 'Kluster #JTM-07 · RS Mitra Sehat Surabaya (ICU)',
    branchCode: 'KC-SBY',
    primaryHospitalId: '0201R001',
    centralDoctorId: 'SP-OG-201',
    riskScore: 76,
    priorityLevel: 'kritis',
    fraudTypology: 'phantom_billing',
    triggerReason: 'combined',
    escalatedClaimCount: 11,
    potentialLossIdr: 95_000_000,
    agreedTgrIdr: 0,
    followupStage: 'sidak_fisik',
    finalStatus: 'belum_final',
    auditResultNote:
      'Ketidaksesuaian jam masuk ICU & log absensi perawat jaga.',
  },
  {
    id: 'JTM-08',
    clusterCode: '#JTM-08',
    title: 'Kluster #JTM-08 · RS Graha Husada (Cath Lab)',
    branchCode: 'KC-SBY',
    primaryHospitalId: '0201R004',
    centralDoctorId: 'SP-JNT-204',
    riskScore: 73,
    priorityLevel: 'kritis',
    fraudTypology: 'repeat_billing',
    triggerReason: 'cluster_frequency',
    escalatedClaimCount: 10,
    potentialLossIdr: 55_000_000,
    agreedTgrIdr: 0,
    followupStage: 'sidak_fisik',
    finalStatus: 'belum_final',
    auditResultNote:
      'Penagihan ulang angiografi di bawah 14 hari tanpa dokumentasi IGD.',
  },
  {
    id: 'JTM-09',
    clusterCode: '#JTM-09',
    title: 'Kluster #JTM-09 · RS Mitra Sehat (Farmasi)',
    branchCode: 'KC-SBY',
    primaryHospitalId: '0201R001',
    centralDoctorId: 'SP-OG-201',
    riskScore: 62,
    priorityLevel: 'perhatian',
    fraudTypology: 'unbundling',
    triggerReason: 'financial_exposure',
    escalatedClaimCount: 10,
    potentialLossIdr: 52_000_000,
    agreedTgrIdr: 0,
    followupStage: 'tagih_tgr',
    finalStatus: 'belum_final',
    auditResultNote:
      'Pemisahan tagihan alat kesehatan operasi di luar paket INA-CBG.',
  },
  {
    id: 'JTM-10',
    clusterCode: '#JTM-10',
    title: 'Kluster #JTM-10 · RS Citra Husada Jember',
    branchCode: 'KC-JBR',
    primaryHospitalId: '0205R003',
    centralDoctorId: 'SP-PD-209',
    riskScore: 66,
    priorityLevel: 'perhatian',
    fraudTypology: 'repeat_billing',
    triggerReason: 'cluster_frequency',
    escalatedClaimCount: 12,
    potentialLossIdr: 78_000_000,
    agreedTgrIdr: 0,
    followupStage: 'sidak_fisik',
    finalStatus: 'belum_final',
    auditResultNote:
      'Readmisi pasien rawat inap < 7 hari dengan diagnosis primer identik.',
  },
  {
    id: 'JTM-11',
    clusterCode: '#JTM-11',
    title: 'Kluster #JTM-11 · RS Citra Husada (Ranap VIP)',
    branchCode: 'KC-JBR',
    primaryHospitalId: '0205R003',
    centralDoctorId: 'SP-PD-209',
    riskScore: 61,
    priorityLevel: 'perhatian',
    fraudTypology: 'phantom_billing',
    triggerReason: 'financial_exposure',
    escalatedClaimCount: 10,
    potentialLossIdr: 64_000_000,
    agreedTgrIdr: 0,
    followupStage: 'tagih_tgr',
    finalStatus: 'belum_final',
    auditResultNote:
      'Klaim hari rawat melebihi jadwal pulang resume medis.',
  },
  {
    id: 'JTM-12',
    clusterCode: '#JTM-12',
    title: 'Kluster #JTM-12 · RS Citra Husada (Poli Dalam)',
    branchCode: 'KC-JBR',
    primaryHospitalId: '0205R003',
    centralDoctorId: 'SP-PD-209',
    riskScore: 55,
    priorityLevel: 'perhatian',
    fraudTypology: 'self_referral',
    triggerReason: 'dpjp_outlier',
    escalatedClaimCount: 9,
    potentialLossIdr: 48_000_000,
    agreedTgrIdr: 0,
    followupStage: 'tagih_tgr',
    finalStatus: 'belum_final',
    auditResultNote:
      'Rujukan berulang antar faskes dengan pola dokter pemeriksa tetap.',
  },
  {
    id: 'JTM-13',
    clusterCode: '#JTM-13',
    title: 'Kluster #JTM-13 · RS Baptis Kediri',
    branchCode: 'KC-KDR',
    primaryHospitalId: '0208R002',
    centralDoctorId: 'SP-B-212',
    riskScore: 49,
    priorityLevel: 'perhatian',
    fraudTypology: 'upcoding',
    triggerReason: 'financial_exposure',
    escalatedClaimCount: 7,
    potentialLossIdr: 42_000_000,
    agreedTgrIdr: 0,
    followupStage: 'tagih_tgr',
    finalStatus: 'belum_final',
    auditResultNote:
      'Koreksi koding sekunder tindakan bedah minor dalam pemantauan.',
  },
  {
    id: 'JTM-14',
    clusterCode: '#JTM-14',
    title: 'Kluster #JTM-14 · RS Baptis Kediri (Farmasi)',
    branchCode: 'KC-KDR',
    primaryHospitalId: '0208R002',
    centralDoctorId: 'SP-B-212',
    riskScore: 44,
    priorityLevel: 'perhatian',
    fraudTypology: 'unbundling',
    triggerReason: 'cluster_frequency',
    escalatedClaimCount: 7,
    potentialLossIdr: 36_000_000,
    agreedTgrIdr: 0,
    followupStage: 'evaluasi_pks',
    finalStatus: 'belum_final',
    auditResultNote:
      'Pemecahan resep kronis pasien rawat jalan (terkendali · 97,8% patuh).',
  },
]

function q(value: string | null | undefined): string {
  if (value === undefined || value === null) return 'NULL'
  return `'${value.replaceAll("'", "''")}'`
}

function generateClustersSql() {
  const lines: string[] = []

  for (const h of REGIONAL_HOSPITALS) {
    lines.push(
      `INSERT INTO hospitals (id, code, name, facility_type, branch_code, director_name, bed_capacity, bor_total_pct, bor_cardio_vip_pct, compliance_score, compliance_grade, pilar_bor_score, pilar_coding_score, pilar_fast_track_pct, pilar_response_score, tgr_burden_idr, pks_expires_at, pks_status, dominant_typology) VALUES (${q(h.id)}, ${q(h.code)}, ${q(h.name)}, ${q(h.facilityType)}, ${q(h.branchCode)}, ${q(h.directorName)}, ${h.bedCapacity}, ${h.borTotalPct}, ${h.borCardioVipPct}, ${h.complianceScore}, ${q(h.complianceGrade)}, ${h.pilarBorScore}, ${h.pilarCodingScore}, ${h.pilarFastTrackPct}, ${h.pilarResponseScore}, ${h.tgrBurdenIdr}, ${q(h.pksExpiresAt)}, ${q(h.pksStatus)}, ${q(h.dominantTypology)}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, branch_code=excluded.branch_code, compliance_score=excluded.compliance_score, compliance_grade=excluded.compliance_grade, tgr_burden_idr=excluded.tgr_burden_idr, pks_status=excluded.pks_status, dominant_typology=excluded.dominant_typology;`,
    )
  }

  for (const d of REGIONAL_DOCTORS) {
    lines.push(
      `INSERT INTO doctors (id, code, name, specialty, primary_hospital_id, practice_facility_count, repeat_procedure_ratio_pct, peer_avg_ratio_pct, consecutive_rejections) VALUES (${q(d.id)}, ${q(d.code)}, ${q(d.name)}, ${q(d.specialty)}, ${q(d.primaryHospitalId)}, ${d.practiceFacilityCount}, ${d.repeatProcedureRatioPct}, ${d.peerAvgRatioPct}, ${d.consecutiveRejections}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, specialty=excluded.specialty, consecutive_rejections=excluded.consecutive_rejections;`,
    )
  }

  for (const c of CLUSTERS) {
    lines.push(
      `INSERT INTO fraud_clusters (id, cluster_code, title, branch_code, primary_hospital_id, central_doctor_id, risk_score, priority_level, fraud_typology, trigger_reason, escalated_claim_count, potential_loss_idr, agreed_tgr_idr, graph_payload_json, followup_stage, final_status, field_checklist_json, audit_result_note, assigned_auditor_id) VALUES (${q(c.id)}, ${q(c.clusterCode)}, ${q(c.title)}, ${q(c.branchCode)}, ${q(c.primaryHospitalId)}, ${q(c.centralDoctorId)}, ${c.riskScore}, ${q(c.priorityLevel)}, ${q(c.fraudTypology)}, ${q(c.triggerReason)}, ${c.escalatedClaimCount}, ${c.potentialLossIdr}, ${c.agreedTgrIdr}, '{}', ${q(c.followupStage)}, ${q(c.finalStatus)}, '{}', ${q(c.auditResultNote)}, 'usr-ibu-anita') ON CONFLICT(id) DO UPDATE SET title=excluded.title, branch_code=excluded.branch_code, risk_score=excluded.risk_score, priority_level=excluded.priority_level, fraud_typology=excluded.fraud_typology, trigger_reason=excluded.trigger_reason, escalated_claim_count=excluded.escalated_claim_count, potential_loss_idr=excluded.potential_loss_idr, agreed_tgr_idr=excluded.agreed_tgr_idr, followup_stage=excluded.followup_stage, final_status=excluded.final_status, audit_result_note=excluded.audit_result_note;`,
    )
  }

  const outPath = resolve(process.cwd(), 'drizzle/seed-clusters.sql')
  writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8')
  console.log(
    `Generated ${REGIONAL_HOSPITALS.length} regional hospitals, ${REGIONAL_DOCTORS.length} doctors, ${CLUSTERS.length} clusters -> ${outPath}`,
  )
}

generateClustersSql()
