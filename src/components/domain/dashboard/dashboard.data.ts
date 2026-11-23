import { toast } from 'sonner'
import type { VolumeTrendPoint } from '#/components/shared/VolumeTrendChart'
import type { RiskZone } from '#/lib/status-tokens'
import type { UserRole } from '#/schemas/session.schema'

export type PeriodKey = '2026-09' | '2026-08' | '2026-07'

export interface PeriodSnapshot {
  label: string
  totalClaims: number
  totalAmountIdr: number
  fastTrackClaims: number
  fastTrackAmountIdr: number
  manualClaims: number
  manualAmountIdr: number
  highRiskCount: number
  mediumRiskCount: number
  clarifyReadyCount: number
  clarifyWaitingCount: number
  trend: VolumeTrendPoint[]
}

export const PERIOD_SNAPSHOTS: Record<PeriodKey, PeriodSnapshot> = {
  '2026-09': {
    label: 'September 2026',
    totalClaims: 5200,
    totalAmountIdr: 48_200_000_000,
    fastTrackClaims: 4420,
    fastTrackAmountIdr: 38_400_000_000,
    manualClaims: 780,
    manualAmountIdr: 9_800_000_000,
    highRiskCount: 170,
    mediumRiskCount: 610,
    clarifyReadyCount: 12,
    clarifyWaitingCount: 22,
    trend: [
      { label: '10 Sep', claimsCount: 1120, amountIdr: 10_400_000_000 },
      { label: '12 Sep', claimsCount: 1310, amountIdr: 12_100_000_000 },
      { label: '14 Sep', claimsCount: 1260, amountIdr: 11_700_000_000 },
      {
        label: 'Hari Ini',
        claimsCount: 1510,
        amountIdr: 14_000_000_000,
        highlight: true,
      },
    ],
  },
  '2026-08': {
    label: 'Agustus 2026',
    totalClaims: 4950,
    totalAmountIdr: 45_600_000_000,
    fastTrackClaims: 4240,
    fastTrackAmountIdr: 36_900_000_000,
    manualClaims: 710,
    manualAmountIdr: 8_700_000_000,
    highRiskCount: 152,
    mediumRiskCount: 558,
    clarifyReadyCount: 9,
    clarifyWaitingCount: 18,
    trend: [
      { label: '10 Agu', claimsCount: 1080, amountIdr: 9_800_000_000 },
      { label: '15 Agu', claimsCount: 1220, amountIdr: 11_200_000_000 },
      { label: '22 Agu', claimsCount: 1340, amountIdr: 12_400_000_000 },
      {
        label: '31 Agu',
        claimsCount: 1310,
        amountIdr: 12_200_000_000,
        highlight: true,
      },
    ],
  },
  '2026-07': {
    label: 'Juli 2026',
    totalClaims: 4680,
    totalAmountIdr: 42_900_000_000,
    fastTrackClaims: 4050,
    fastTrackAmountIdr: 35_100_000_000,
    manualClaims: 630,
    manualAmountIdr: 7_800_000_000,
    highRiskCount: 134,
    mediumRiskCount: 496,
    clarifyReadyCount: 7,
    clarifyWaitingCount: 15,
    trend: [
      { label: '08 Jul', claimsCount: 1020, amountIdr: 9_300_000_000 },
      { label: '15 Jul', claimsCount: 1180, amountIdr: 10_900_000_000 },
      { label: '23 Jul', claimsCount: 1210, amountIdr: 11_100_000_000 },
      {
        label: '31 Jul',
        claimsCount: 1270,
        amountIdr: 11_600_000_000,
        highlight: true,
      },
    ],
  },
}

export interface HospitalItem {
  id: string
  name: string
  meta: string
  anomalyLabel: string
  zone: RiskZone
  shareFactor: number
}

export const DASHBOARD_HOSPITALS: readonly HospitalItem[] = [
  {
    id: '0195R008',
    name: 'RSUD Medika Malang',
    meta: 'FKRTL Tipe B · Dominan Repeat Billing PCI',
    anomalyLabel: '42 Anomali',
    zone: 'merah',
    shareFactor: 0.28,
  },
  {
    id: '0195R011',
    name: 'RS Hermosa Malang',
    meta: 'FKRTL Tipe C · Dominan Phantom Ranap',
    anomalyLabel: '28 Anomali',
    zone: 'merah',
    shareFactor: 0.22,
  },
  {
    id: '0195R014',
    name: 'RSIA Melati Malang',
    meta: 'FKRTL Tipe C · Indikasi Upcoding Sesar',
    anomalyLabel: '19 Anomali',
    zone: 'kuning',
    shareFactor: 0.18,
  },
  {
    id: '0112R001',
    name: 'RSUD Dr. Saiful Anwar',
    meta: 'FKRTL Tipe A · Patuh (98,4% Klaim Wajar)',
    anomalyLabel: '3 Deviasi',
    zone: 'hijau',
    shareFactor: 0.32,
  },
]

export interface PriorityCase {
  id: string
  hospitalId: string
  hospitalName: string
  sep: string
  title: string
  meta: string
  amountIdr: number
  score: number
  readyToDecide?: boolean
}

export const DASHBOARD_PRIORITY_CASES: readonly PriorityCase[] = [
  {
    id: 'clm-0123',
    hospitalId: '0195R008',
    hospitalName: 'RSUD Medika Malang',
    sep: '0112R0010924V000123',
    title: 'Pasien #B-9021 · Kateterisasi PCI (37.22)',
    meta: 'SEP 0112R0010924V000123 · RSUD Medika · Repeat Billing (Jeda 12 hr)',
    amountIdr: 18_700_000,
    score: 88,
  },
  {
    id: 'clm-0099',
    hospitalId: '0195R008',
    hospitalName: 'RSUD Medika Malang',
    sep: '0112R0010924V000099',
    title: 'Pasien #D-5512 · Kateterisasi PCI (Balasan e-Office)',
    meta: 'SEP 0112R0010924V000099 · RSUD Medika · 2 dokumen RS diunggah (Sisa 18j)',
    amountIdr: 18_700_000,
    score: 84,
    readyToDecide: true,
  },
  {
    id: 'clm-0145',
    hospitalId: '0195R011',
    hospitalName: 'RS Hermosa Malang',
    sep: '0112R0010924V000145',
    title: 'Pasien #K-3102 · Dispepsia Rawat Inap 3 Hari',
    meta: 'SEP 0112R0010924V000145 · RS Hermosa · Indikasi Phantom Billing',
    amountIdr: 5_400_000,
    score: 82,
  },
  {
    id: 'clm-0210',
    hospitalId: '0195R014',
    hospitalName: 'RSIA Melati Malang',
    sep: '0112R0010924V000210',
    title: 'Pasien #M-4419 · Sesar Penyulit (O-6-10-III)',
    meta: 'SEP 0112R0010924V000210 · RSIA Melati · Deviasi Tarif Upcoding',
    amountIdr: 12_800_000,
    score: 58,
  },
]

export const DASHBOARD_ROLE_SUBTITLE: Record<
  UserRole,
  (unitName: string, clarifyReadyCount: number) => string
> = {
  verifikator: (unitName, count) =>
    `Ringkasan verifikasi klaim FKRTL ${unitName} · ${count} berkas klarifikasi RS siap diputuskan hari ini.`,
  auditor_wilayah: (unitName) =>
    `Pengawasan kluster eskalasi anti-fraud ${unitName} · pantauan risiko lintas cabang dan tindak lanjut audit.`,
  kepala_cabang: (unitName) =>
    `Evaluasi kepatuhan FKRTL & kebijakan PKS ${unitName} · ringkasan eksposur klaim periode aktif.`,
}

export function exportDashboardCsv(
  cases: readonly PriorityCase[],
  period: PeriodKey,
  periodLabel: string,
  hospitalId: string,
): void {
  const headers = ['No SEP', 'Kasus', 'Rumah Sakit', 'Skor AI', 'Nominal IDR']
  const rows = cases.map((c) => [
    c.sep,
    `"${c.title}"`,
    `"${c.hospitalName}"`,
    String(c.score),
    String(c.amountIdr),
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rekap-claimguard-${period}-${hospitalId}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`Rekap ${periodLabel} (${cases.length} kasus) diunduh`)
}
