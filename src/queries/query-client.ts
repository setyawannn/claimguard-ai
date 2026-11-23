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

/**
 * Konfigurasi QueryClient ramah kuota Cloudflare D1 Free Tier:
 * - refetchOnWindowFocus: false -> mencegah query ulang saat auditor bolak-balik tab e-Office
 * - staleTime 30 detik & gcTime 5 menit -> menekan rows_read D1
 * - retry berhenti instan pada error Circuit Breaker 95% atau RBAC
 */
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
