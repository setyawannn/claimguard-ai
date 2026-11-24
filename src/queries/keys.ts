import type {
  ClaimsFilterInput,
  ClaimsHistoryFilterInput,
} from '#/schemas/claims.schema'
import type {
  ClusterFollowupFilterInput,
  ClustersFilterInput,
  InvestigationSearchInput,
  RegionalDashboardFilterInput,
} from '#/schemas/clusters.schema'
import type {
  ExecutiveDashboardFilterInput,
  HospitalsFilterInput,
  PksDecisionsFilterInput,
} from '#/schemas/hospitals.schema'

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
    history: (filters: ClaimsHistoryFilterInput) =>
      ['claims', 'history', filters] as const,
  },
  clusters: {
    all: ['clusters'] as const,
    dashboard: (filters: RegionalDashboardFilterInput) =>
      ['clusters', 'dashboard', filters] as const,
    investigation: (params: InvestigationSearchInput) =>
      ['clusters', 'investigation', params] as const,
    followup: (filters: ClusterFollowupFilterInput) =>
      ['clusters', 'followup', filters] as const,
    list: (filters: ClustersFilterInput) =>
      ['clusters', 'list', filters] as const,
    detail: (clusterId: string) => ['clusters', 'detail', clusterId] as const,
  },
  hospitals: {
    all: ['hospitals'] as const,
    executiveDashboard: (filters: ExecutiveDashboardFilterInput) =>
      ['hospitals', 'executive-dashboard', filters] as const,
    list: (filters: HospitalsFilterInput) =>
      ['hospitals', 'list', filters] as const,
    detail: (hospitalId: string) =>
      ['hospitals', 'detail', hospitalId] as const,
  },
  pks: {
    all: ['pks'] as const,
    list: (filters: PksDecisionsFilterInput) => ['pks', 'list', filters] as const,
  },
} as const
