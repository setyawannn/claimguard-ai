export interface RegionalBranchMeta {
  code: string
  name: string
  hospitalCountLabel: string
  fallbackSummary: string
}

export const JATIM_BRANCHES: readonly RegionalBranchMeta[] = [
  {
    code: 'KC-MLG',
    name: 'KC Malang',
    hospitalCountLabel: '12 RS FKRTL',
    fallbackSummary: 'Dominan Repeat Billing PCI & Phantom Ranap',
  },
  {
    code: 'KC-SBY',
    name: 'KC Surabaya',
    hospitalCountLabel: '28 RS FKRTL',
    fallbackSummary: 'Dominan Upcoding Sesar & Kardiologi',
  },
  {
    code: 'KC-JBR',
    name: 'KC Jember',
    hospitalCountLabel: '14 RS FKRTL',
    fallbackSummary: 'Indikasi Readmisi Dini Rawat Inap',
  },
  {
    code: 'KC-KDR',
    name: 'KC Kediri',
    hospitalCountLabel: '16 RS FKRTL',
    fallbackSummary: 'Terkendali (97,8% Klaim Patuh)',
  },
]

export const JATIM_BRANCH_NAME_MAP = new Map(
  JATIM_BRANCHES.map((b) => [b.code, b.name]),
)
