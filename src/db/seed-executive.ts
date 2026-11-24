import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface ExecHospitalSeed {
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
  pksStatus:
    | 'aktif'
    | 'evaluasi_pks'
    | 'pks_bersyarat'
    | 'teguran_sp1'
    | 'pembinaan'
    | 'diperpanjang'
  pksEofficeNumber: string | null
  dominantTypology: string
}

interface ExecPksSeed {
  id: string
  hospitalId: string
  clusterId: string | null
  evaluationPeriod: string
  recommendedPolicy: 'pks_bersyarat' | 'teguran_sp1' | 'pembinaan' | 'perpanjang'
  finalPolicy: string | null
  tgrCommitmentIdr: number
  addendumRequirements: string[]
  eofficeRefNumber: string | null
  executiveNote: string
  isLocked: boolean
}

const MALANG_HOSPITALS: readonly ExecHospitalSeed[] = [
  {
    id: '0195R008',
    code: '0195R008',
    name: 'RSUD Medika Malang',
    facilityType: 'B',
    branchCode: 'KC-MLG',
    directorName: 'dr. Haryono, M.Kes',
    bedCapacity: 180,
    borTotalPct: 98.0,
    borCardioVipPct: 118.0,
    complianceScore: 61,
    complianceGrade: 'D',
    pilarBorScore: 52,
    pilarCodingScore: 58,
    pilarFastTrackPct: 85.8,
    pilarResponseScore: 70,
    tgrBurdenIdr: 420_000_000,
    pksExpiresAt: '2026-12-31',
    pksStatus: 'evaluasi_pks',
    pksEofficeNumber: null,
    dominantTypology: 'Repeat Billing PCI & Kardiologi (14,2% bermasalah)',
  },
  {
    id: '0195R011',
    code: '0195R011',
    name: 'RS Hermosa Malang',
    facilityType: 'C',
    branchCode: 'KC-MLG',
    directorName: 'dr. Hartono Wijaya, M.Kes',
    bedCapacity: 110,
    borTotalPct: 84.0,
    borCardioVipPct: 94.0,
    complianceScore: 68,
    complianceGrade: 'D',
    pilarBorScore: 66,
    pilarCodingScore: 65,
    pilarFastTrackPct: 88.5,
    pilarResponseScore: 72,
    tgrBurdenIdr: 200_000_000,
    pksExpiresAt: '2026-12-31',
    pksStatus: 'teguran_sp1',
    pksEofficeNumber: '#398/KC-MLG/X/26',
    dominantTypology: 'Phantom Ranap & Unbundling Obat',
  },
  {
    id: '0195R014',
    code: '0195R014',
    name: 'RSIA Melati Malang',
    facilityType: 'C',
    branchCode: 'KC-MLG',
    directorName: 'dr. Ratna Dewi, Sp.OG',
    bedCapacity: 90,
    borTotalPct: 76.0,
    borCardioVipPct: 78.0,
    complianceScore: 79,
    complianceGrade: 'C',
    pilarBorScore: 84,
    pilarCodingScore: 74,
    pilarFastTrackPct: 93.6,
    pilarResponseScore: 81,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2027-06-30',
    pksStatus: 'pembinaan',
    pksEofficeNumber: '#405/KC-MLG/X/26',
    dominantTypology: 'Selisih Koding Sesar Berulang (Upcoding Ringan)',
  },
  {
    id: '0195R029',
    code: '0195R029',
    name: 'RS Prima Husada Malang',
    facilityType: 'C',
    branchCode: 'KC-MLG',
    directorName: 'dr. Dimas Prasetyo, MARS',
    bedCapacity: 110,
    borTotalPct: 74.0,
    borCardioVipPct: 75.0,
    complianceScore: 84,
    complianceGrade: 'B',
    pilarBorScore: 86,
    pilarCodingScore: 83,
    pilarFastTrackPct: 95.1,
    pilarResponseScore: 85,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2027-08-31',
    pksStatus: 'aktif',
    pksEofficeNumber: null,
    dominantTypology: 'Rujukan Jantung Non-Emergensi (Dalam Pantauan)',
  },
  {
    id: '0195R004',
    code: '0195R004',
    name: 'RS Lavalette Malang',
    facilityType: 'B',
    branchCode: 'KC-MLG',
    directorName: 'dr. Maya Sari, MARS',
    bedCapacity: 210,
    borTotalPct: 79.0,
    borCardioVipPct: 81.0,
    complianceScore: 91,
    complianceGrade: 'A',
    pilarBorScore: 92,
    pilarCodingScore: 90,
    pilarFastTrackPct: 97.9,
    pilarResponseScore: 94,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2026-12-31',
    pksStatus: 'diperpanjang',
    pksEofficeNumber: '#401/KC-MLG/X/26',
    dominantTypology: 'Nihil Anomali Signifikan',
  },
  {
    id: '0112R001',
    code: '0112R001',
    name: 'RSUD Dr. Saiful Anwar',
    facilityType: 'A',
    branchCode: 'KC-MLG',
    directorName: 'Dr. dr. Bachtiar Budianto, Sp.B',
    bedCapacity: 680,
    borTotalPct: 81.0,
    borCardioVipPct: 82.0,
    complianceScore: 96,
    complianceGrade: 'A',
    pilarBorScore: 95,
    pilarCodingScore: 96,
    pilarFastTrackPct: 98.8,
    pilarResponseScore: 97,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2026-12-31',
    pksStatus: 'diperpanjang',
    pksEofficeNumber: '#402/KC-MLG/X/26',
    dominantTypology: 'Mitra Teladan KC Malang',
  },
  {
    id: '0195R005',
    code: '0195R005',
    name: 'RS Panti Waluya Sawahan',
    facilityType: 'B',
    branchCode: 'KC-MLG',
    directorName: 'dr. Antonius Wibowo, MARS',
    bedCapacity: 200,
    borTotalPct: 77.5,
    borCardioVipPct: 79.0,
    complianceScore: 92,
    complianceGrade: 'A',
    pilarBorScore: 93,
    pilarCodingScore: 91,
    pilarFastTrackPct: 97.4,
    pilarResponseScore: 92,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2027-04-30',
    pksStatus: 'diperpanjang',
    pksEofficeNumber: null,
    dominantTypology: 'Kepatuhan Koding Baik',
  },
  {
    id: '0195R006',
    code: '0195R006',
    name: 'RS Hermina Tangkubanprahu',
    facilityType: 'B',
    branchCode: 'KC-MLG',
    directorName: 'dr. Lestari Indah, M.Kes',
    bedCapacity: 175,
    borTotalPct: 75.2,
    borCardioVipPct: 77.0,
    complianceScore: 90,
    complianceGrade: 'A',
    pilarBorScore: 91,
    pilarCodingScore: 89,
    pilarFastTrackPct: 96.8,
    pilarResponseScore: 91,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2027-05-31',
    pksStatus: 'diperpanjang',
    pksEofficeNumber: null,
    dominantTypology: 'Kepatuhan Koding Baik',
  },
  {
    id: '0195R007',
    code: '0195R007',
    name: 'RS Islam Aisyiyah Malang',
    facilityType: 'C',
    branchCode: 'KC-MLG',
    directorName: 'dr. Ahmad Fauzi, MARS',
    bedCapacity: 140,
    borTotalPct: 72.8,
    borCardioVipPct: 74.0,
    complianceScore: 89,
    complianceGrade: 'A',
    pilarBorScore: 90,
    pilarCodingScore: 88,
    pilarFastTrackPct: 96.2,
    pilarResponseScore: 89,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2027-07-31',
    pksStatus: 'diperpanjang',
    pksEofficeNumber: null,
    dominantTypology: 'Nihil Anomali Signifikan',
  },
  {
    id: '0195R009',
    code: '0195R009',
    name: 'RS Wava Husada Kepanjen',
    facilityType: 'B',
    branchCode: 'KC-MLG',
    directorName: 'dr. Hendri Saputra, MARS',
    bedCapacity: 230,
    borTotalPct: 80.5,
    borCardioVipPct: 82.0,
    complianceScore: 88,
    complianceGrade: 'A',
    pilarBorScore: 89,
    pilarCodingScore: 87,
    pilarFastTrackPct: 95.9,
    pilarResponseScore: 88,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2027-03-31',
    pksStatus: 'diperpanjang',
    pksEofficeNumber: null,
    dominantTypology: 'Nihil Anomali Signifikan',
  },
  {
    id: '0195R010',
    code: '0195R010',
    name: 'RS Persada Hospital Malang',
    facilityType: 'B',
    branchCode: 'KC-MLG',
    directorName: 'dr. Kusuma Wardani, MARS',
    bedCapacity: 165,
    borTotalPct: 76.0,
    borCardioVipPct: 78.5,
    complianceScore: 91,
    complianceGrade: 'A',
    pilarBorScore: 92,
    pilarCodingScore: 90,
    pilarFastTrackPct: 97.1,
    pilarResponseScore: 91,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2027-09-30',
    pksStatus: 'diperpanjang',
    pksEofficeNumber: null,
    dominantTypology: 'Nihil Anomali Signifikan',
  },
  {
    id: '0195R012',
    code: '0195R012',
    name: 'RS Marsudi Waluyo',
    facilityType: 'C',
    branchCode: 'KC-MLG',
    directorName: 'dr. Budi Santoso, M.Kes',
    bedCapacity: 105,
    borTotalPct: 71.5,
    borCardioVipPct: 73.0,
    complianceScore: 87,
    complianceGrade: 'A',
    pilarBorScore: 88,
    pilarCodingScore: 86,
    pilarFastTrackPct: 95.4,
    pilarResponseScore: 87,
    tgrBurdenIdr: 0,
    pksExpiresAt: '2027-10-31',
    pksStatus: 'diperpanjang',
    pksEofficeNumber: null,
    dominantTypology: 'Nihil Anomali Signifikan',
  },
]

const PKS_SEEDS: readonly ExecPksSeed[] = [
  {
    id: 'pks-0195R008',
    hospitalId: '0195R008',
    clusterId: 'JTM-01',
    evaluationPeriod: 'Q3 2026',
    recommendedPolicy: 'pks_bersyarat',
    finalPolicy: null,
    tgrCommitmentIdr: 420_000_000,
    addendumRequirements: [
      'Pelunasan TGR Rp 420 Jt maks. 30 Nov 2026',
      'Integrasi Real-Time Kapasitas Kasur Aplicares',
      'Audit Kepatuhan Tindakan Kateterisasi PCI',
    ],
    eofficeRefNumber: null,
    executiveNote:
      'Bahan rapat evaluasi PKS disiapkan bersama Direktur RSUD Medika Malang terkait pelunasan TGR Rp 420 Jt & perbaikan BOR Aplicares.',
    isLocked: false,
  },
  {
    id: 'pks-0195R011',
    hospitalId: '0195R011',
    clusterId: 'JTM-02',
    evaluationPeriod: 'Q3 2026',
    recommendedPolicy: 'teguran_sp1',
    finalPolicy: 'PKS Bersyarat 6 Bln',
    tgrCommitmentIdr: 200_000_000,
    addendumRequirements: [
      'Pelunasan TGR Rp 200 Jt secara bertahap (2 termin)',
      'Validasi buku register bangsal rawat inap',
    ],
    eofficeRefNumber: 'BA-PKS/398/KC-MLG/X/2026',
    executiveNote:
      'SP-1 diterbitkan di e-Office (#398/KC-MLG/X/26); cicilan TGR Rp 200 Jt berjalan.',
    isLocked: true,
  },
  {
    id: 'pks-0195R014',
    hospitalId: '0195R014',
    clusterId: 'JTM-04',
    evaluationPeriod: 'Q3 2026',
    recommendedPolicy: 'pembinaan',
    finalPolicy: 'Pembinaan & Audit Bulanan',
    tgrCommitmentIdr: 0,
    addendumRequirements: [
      'Audit koding INA-CBG Sesar bulanan oleh tim casemix',
    ],
    eofficeRefNumber: 'BA-PKS/405/KC-MLG/X/2026',
    executiveNote:
      'BA Pembinaan Casemix ditandatangani; pemantauan koding sesar triwulan.',
    isLocked: true,
  },
  {
    id: 'pks-0195R004',
    hospitalId: '0195R004',
    clusterId: null,
    evaluationPeriod: 'Q3 2026',
    recommendedPolicy: 'perpanjang',
    finalPolicy: 'Perpanjang Penuh',
    tgrCommitmentIdr: 0,
    addendumRequirements: [],
    eofficeRefNumber: 'BA-PKS/401/KC-MLG/X/2026',
    executiveNote:
      'Addendum perpanjangan PKS 2027 ditandatangani (Skor 91 · Grade A).',
    isLocked: true,
  },
  {
    id: 'pks-0112R001',
    hospitalId: '0112R001',
    clusterId: null,
    evaluationPeriod: 'Q3 2026',
    recommendedPolicy: 'perpanjang',
    finalPolicy: 'Perpanjang Penuh',
    tgrCommitmentIdr: 0,
    addendumRequirements: [],
    eofficeRefNumber: 'BA-PKS/402/KC-MLG/X/2026',
    executiveNote:
      'Perpanjangan PKS 2027 & piagam apresiasi kepatuhan FKRTL terbaik KC Malang.',
    isLocked: true,
  },
]

function q(value: string | null | undefined): string {
  if (value === undefined || value === null) return 'NULL'
  return `'${value.replaceAll("'", "''")}'`
}

function generateExecutiveSql() {
  const lines: string[] = []

  for (const h of MALANG_HOSPITALS) {
    lines.push(
      `INSERT INTO hospitals (id, code, name, facility_type, branch_code, director_name, bed_capacity, bor_total_pct, bor_cardio_vip_pct, compliance_score, compliance_grade, pilar_bor_score, pilar_coding_score, pilar_fast_track_pct, pilar_response_score, tgr_burden_idr, pks_expires_at, pks_status, pks_eoffice_number, dominant_typology) VALUES (${q(h.id)}, ${q(h.code)}, ${q(h.name)}, ${q(h.facilityType)}, ${q(h.branchCode)}, ${q(h.directorName)}, ${h.bedCapacity}, ${h.borTotalPct}, ${h.borCardioVipPct}, ${h.complianceScore}, ${q(h.complianceGrade)}, ${h.pilarBorScore}, ${h.pilarCodingScore}, ${h.pilarFastTrackPct}, ${h.pilarResponseScore}, ${h.tgrBurdenIdr}, ${q(h.pksExpiresAt)}, ${q(h.pksStatus)}, ${q(h.pksEofficeNumber)}, ${q(h.dominantTypology)}) ON CONFLICT(id) DO UPDATE SET name=excluded.name, facility_type=excluded.facility_type, director_name=excluded.director_name, bed_capacity=excluded.bed_capacity, bor_total_pct=excluded.bor_total_pct, bor_cardio_vip_pct=excluded.bor_cardio_vip_pct, compliance_score=excluded.compliance_score, compliance_grade=excluded.compliance_grade, pilar_bor_score=excluded.pilar_bor_score, pilar_coding_score=excluded.pilar_coding_score, pilar_fast_track_pct=excluded.pilar_fast_track_pct, pilar_response_score=excluded.pilar_response_score, tgr_burden_idr=excluded.tgr_burden_idr, pks_expires_at=excluded.pks_expires_at, pks_status=excluded.pks_status, pks_eoffice_number=excluded.pks_eoffice_number, dominant_typology=excluded.dominant_typology;`,
    )
  }

  for (const p of PKS_SEEDS) {
    const reqJson = JSON.stringify(p.addendumRequirements)
    const checklistJson = JSON.stringify({
      baSigned: p.isLocked,
      tgrCommitmentReceived: p.isLocked,
      eofficeRecorded: p.isLocked,
    })
    lines.push(
      `INSERT INTO pks_decisions (id, hospital_id, cluster_id, evaluation_period, recommended_policy, final_policy, tgr_commitment_idr, addendum_requirements_json, meeting_checklist_json, eoffice_ref_number, executive_note, is_locked, decided_by) VALUES (${q(p.id)}, ${q(p.hospitalId)}, ${q(p.clusterId)}, ${q(p.evaluationPeriod)}, ${q(p.recommendedPolicy)}, ${q(p.finalPolicy)}, ${p.tgrCommitmentIdr}, ${q(reqJson)}, ${q(checklistJson)}, ${q(p.eofficeRefNumber)}, ${q(p.executiveNote)}, ${p.isLocked ? 1 : 0}, 'usr-pak-rudi') ON CONFLICT(id) DO UPDATE SET recommended_policy=excluded.recommended_policy, final_policy=excluded.final_policy, tgr_commitment_idr=excluded.tgr_commitment_idr, addendum_requirements_json=excluded.addendum_requirements_json, meeting_checklist_json=excluded.meeting_checklist_json, eoffice_ref_number=excluded.eoffice_ref_number, executive_note=excluded.executive_note, is_locked=excluded.is_locked;`,
    )
  }

  const outPath = resolve(process.cwd(), 'drizzle/seed-executive.sql')
  writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8')
  console.log(
    `Generated ${MALANG_HOSPITALS.length} KC Malang hospitals, ${PKS_SEEDS.length} PKS seeds -> ${outPath}`,
  )
}

generateExecutiveSql()
