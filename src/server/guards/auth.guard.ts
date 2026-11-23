import { getCookie, setCookie } from '@tanstack/react-start/server'
import {
  PERSONA_BY_ROLE,
  userRoleSchema,
  type SessionUser,
  type UserRole,
} from '#/schemas/session.schema'

const ROLE_COOKIE_NAME = 'cg_role'
const DEFAULT_ROLE: UserRole = 'verifikator'

export function getActiveSession(): SessionUser {
  const raw = getCookie(ROLE_COOKIE_NAME)
  const parsed = userRoleSchema.safeParse(raw)
  const role = parsed.success ? parsed.data : DEFAULT_ROLE
  return PERSONA_BY_ROLE[role]
}

export function setActiveRoleCookie(role: UserRole): SessionUser {
  setCookie(ROLE_COOKIE_NAME, role, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })
  return PERSONA_BY_ROLE[role]
}

export function requireRole(allowedRoles: readonly UserRole[]): SessionUser {
  const user = getActiveSession()
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `FORBIDDEN: Peran '${user.title}' tidak memiliki otoritas untuk tindakan ini.`,
    )
  }
  return user
}
