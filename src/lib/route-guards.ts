import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { ZodError } from 'zod'
import type { SessionUser, UserRole } from '#/schemas/session.schema'
import { sessionQueryOptions } from '#/queries/session.queries'

export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_CREDENTIALS'
  | 'D1_QUOTA_GUARD'
  | 'R2_QUOTA_GUARD'
  | 'VALIDATION'
  | 'UNKNOWN'

export interface ParsedAppError {
  code: AppErrorCode
  message: string
}

const KNOWN_CODES: readonly Exclude<AppErrorCode, 'VALIDATION' | 'UNKNOWN'>[] = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INVALID_CREDENTIALS',
  'D1_QUOTA_GUARD',
  'R2_QUOTA_GUARD',
]

export function sanitizeRedirectPath(raw: unknown): string {
  if (typeof raw !== 'string') return '/'
  const trimmed = raw.trim()
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    trimmed.startsWith('/login')
  ) {
    return '/'
  }
  return trimmed
}

export function parseAppError(error: unknown): ParsedAppError {
  if (error instanceof ZodError) {
    return {
      code: 'VALIDATION',
      message: error.issues[0]?.message ?? 'Data masukan tidak valid.',
    }
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Terjadi gangguan sistem. Silakan coba kembali.'

  for (const code of KNOWN_CODES) {
    if (rawMessage.includes(code)) {
      const idx = rawMessage.indexOf(`${code}:`)
      const cleaned =
        idx >= 0 ? rawMessage.slice(idx + code.length + 1).trim() : rawMessage
      return {
        code,
        message: cleaned || rawMessage,
      }
    }
  }

  try {
    const parsed = JSON.parse(rawMessage) as Array<{ message?: string }>
    if (Array.isArray(parsed) && parsed[0]?.message) {
      return { code: 'VALIDATION', message: parsed[0].message }
    }
  } catch {
    // Abaikan jika pesan error bukan serialisasi ZodError JSON
  }

  return { code: 'UNKNOWN', message: rawMessage }
}

interface RouteGuardArgs {
  context: { queryClient: QueryClient }
  location: { href: string }
}

export async function requireRouteAuth({
  context,
  location,
}: RouteGuardArgs): Promise<SessionUser> {
  const user = await context.queryClient.ensureQueryData(sessionQueryOptions())
  if (!user) {
    const target = sanitizeRedirectPath(location.href)
    throw redirect({
      to: '/login',
      search: target === '/' ? {} : { redirect: target },
    })
  }
  return user
}

export async function requireRouteRole(
  args: RouteGuardArgs,
  allowedRoles: readonly UserRole[],
): Promise<SessionUser> {
  const user = await requireRouteAuth(args)
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `FORBIDDEN: Peran '${user.title}' tidak memiliki otoritas untuk mengakses halaman ini.`,
    )
  }
  return user
}
