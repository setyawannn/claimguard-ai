export type RiskZone = 'hijau' | 'kuning' | 'merah'
export type ClaimStatus =
  | 'belum_dicek'
  | 'klarifikasi'
  | 'balasan_rs'
  | 'pending_rs'
  | 'disetujui'
  | 'false_positive'
  | 'ditolak'
export type FraudTypology =
  | 'none'
  | 'repeat_billing'
  | 'phantom_billing'
  | 'upcoding'
  | 'unbundling'
  | 'self_referral'
export type ClusterStage =
  | 'baru'
  | 'sidak_fisik'
  | 'tagih_tgr'
  | 'evaluasi_pks'
  | 'limpah_aph'
  | 'arsip_wajar'
export type PksStatus =
  | 'aktif'
  | 'evaluasi_pks'
  | 'pks_bersyarat'
  | 'teguran_sp1'
  | 'pembinaan'
  | 'diperpanjang'
export type ComplianceGrade = 'A' | 'B' | 'C' | 'D'

export interface BadgeToneMeta {
  label: string
  badgeClass: string
  dotClass: string
}

const TONE_HIGH = {
  badgeClass:
    'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high-border)] text-[var(--color-risk-high-text)]',
  dotClass: 'bg-[var(--color-risk-high)]',
} as const

const TONE_MEDIUM = {
  badgeClass:
    'bg-[var(--color-risk-medium-bg)] border-[var(--color-risk-medium-border)] text-[var(--color-risk-medium-text)]',
  dotClass: 'bg-[var(--color-risk-medium)]',
} as const

const TONE_LOW = {
  badgeClass:
    'bg-[var(--color-risk-low-bg)] border-[var(--color-risk-low-border)] text-[var(--color-risk-low-text)]',
  dotClass: 'bg-[var(--color-risk-low)]',
} as const

const TONE_PRIMARY = {
  badgeClass:
    'bg-[var(--color-action-primary-bg)] border-[var(--color-action-primary-border)] text-[var(--color-action-primary)]',
  dotClass: 'bg-[var(--color-action-primary)]',
} as const

const TONE_CLARIFY = {
  badgeClass:
    'bg-[var(--color-status-clarify-bg)] border-[var(--color-status-clarify-border)] text-[var(--color-status-clarify-text)]',
  dotClass: 'bg-[var(--color-status-clarify)]',
} as const

const TONE_NEUTRAL = {
  badgeClass:
    'bg-[var(--color-bg-muted)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
  dotClass: 'bg-[var(--color-text-secondary)]',
} as const

export function getRiskZone(score: number): RiskZone {
  if (score >= 70) return 'merah'
  if (score >= 40) return 'kuning'
  return 'hijau'
}

export const RISK_ZONE_META: Record<RiskZone, BadgeToneMeta> = {
  hijau: { label: 'Wajar (Fast-Track)', ...TONE_LOW },
  kuning: { label: 'Perhatian', ...TONE_MEDIUM },
  merah: { label: 'Risiko Tinggi', ...TONE_HIGH },
}

export const CLAIM_STATUS_META: Record<ClaimStatus, BadgeToneMeta> = {
  belum_dicek: { label: 'Belum Dicek', ...TONE_NEUTRAL },
  klarifikasi: { label: 'Klarifikasi', ...TONE_MEDIUM },
  balasan_rs: { label: 'Balasan RS', ...TONE_CLARIFY },
  pending_rs: { label: 'Pending RS', ...TONE_MEDIUM },
  disetujui: { label: 'Disetujui', ...TONE_LOW },
  false_positive: { label: 'False Positive', ...TONE_PRIMARY },
  ditolak: { label: 'Ditolak', ...TONE_HIGH },
}

export const FRAUD_TYPOLOGY_META: Record<FraudTypology, string> = {
  none: 'Klaim Wajar',
  repeat_billing: 'Repeat Billing & Readmisi',
  phantom_billing: 'Phantom Billing & BOR',
  upcoding: 'Upcoding INA-CBG',
  unbundling: 'Unbundling Paket Obat',
  self_referral: 'Kolusi Rujukan Sirkular',
}

export const CLUSTER_STAGE_META: Record<ClusterStage, BadgeToneMeta> = {
  baru: { label: 'Eskalasi Baru', ...TONE_HIGH },
  sidak_fisik: { label: 'Sidak Fisik', ...TONE_MEDIUM },
  tagih_tgr: { label: 'Tagih TGR', ...TONE_HIGH },
  evaluasi_pks: { label: 'Evaluasi PKS', ...TONE_PRIMARY },
  limpah_aph: { label: 'Limpah APH', ...TONE_CLARIFY },
  arsip_wajar: { label: 'Arsip Wajar', ...TONE_LOW },
}

export const PKS_STATUS_META: Record<PksStatus, BadgeToneMeta> = {
  aktif: { label: 'PKS Aktif', ...TONE_LOW },
  evaluasi_pks: { label: 'Evaluasi PKS', ...TONE_HIGH },
  pks_bersyarat: { label: 'PKS Bersyarat', ...TONE_MEDIUM },
  teguran_sp1: { label: 'Teguran SP-1', ...TONE_HIGH },
  pembinaan: { label: 'Pembinaan', ...TONE_MEDIUM },
  diperpanjang: { label: 'Perpanjang PKS', ...TONE_LOW },
}

export const COMPLIANCE_GRADE_META: Record<ComplianceGrade, BadgeToneMeta> = {
  A: { label: 'Grade A · Mitra Patuh', ...TONE_LOW },
  B: { label: 'Grade B · Baik', ...TONE_PRIMARY },
  C: { label: 'Grade C · Pembinaan', ...TONE_MEDIUM },
  D: { label: 'Grade D · Kritis PKS', ...TONE_HIGH },
}
