import { QueryClient } from '@tanstack/react-query'

const QUOTA_OR_AUTH_ERRORS = [
  'D1_QUOTA_GUARD',
  'R2_QUOTA_GUARD',
  'UNAUTHORIZED',
  'FORBIDDEN',
]

export function isQuotaOrAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return QUOTA_OR_AUTH_ERRORS.some((code) => error.message.includes(code))
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isQuotaOrAuthError(error)) return false
          return failureCount < 1
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
