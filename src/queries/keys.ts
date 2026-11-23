import type { ClaimsFilterInput } from '#/schemas/claims.schema'
import type { ClustersFilterInput } from '#/schemas/clusters.schema'
import type { HospitalsFilterInput } from '#/schemas/hospitals.schema'

export const queryKeys = {
  session: {
    all: ['session'] as const,
    current: () => ['session', 'current'] as const,
  },
  claims: {
    all: ['claims'] as const,
    dashboard: (branchCode: string) =>
      ['claims', 'dashboard', branchCode] as const,
    list: (filters: ClaimsFilterInput) =>
      ['claims', 'list', filters] as const,
    detail: (claimId: string) => ['claims', 'detail', claimId] as const,
    history: (branchCode: string) =>
      ['claims', 'history', branchCode] as const,
  },
  clusters: {
    all: ['clusters'] as const,
    dashboard: () => ['clusters', 'dashboard'] as const,
    list: (filters: ClustersFilterInput) =>
      ['clusters', 'list', filters] as const,
    detail: (clusterId: string) => ['clusters', 'detail', clusterId] as const,
  },
  hospitals: {
    all: ['hospitals'] as const,
    executiveDashboard: (branchCode: string) =>
      ['hospitals', 'executive-dashboard', branchCode] as const,
    list: (filters: HospitalsFilterInput) =>
      ['hospitals', 'list', filters] as const,
    detail: (hospitalId: string) =>
      ['hospitals', 'detail', hospitalId] as const,
  },
  pks: {
    all: ['pks'] as const,
    list: (branchCode: string) => ['pks', 'list', branchCode] as const,
  },
} as const
