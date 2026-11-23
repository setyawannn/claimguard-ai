import { createMiddleware } from '@tanstack/react-start'
import type { UserRole } from '#/schemas/session.schema'
import {
  clearSessionCookie,
  getSessionCookie,
  getWorkerDb,
} from '#/server/guards/auth.guard'
import { resolveSessionUser } from '#/server/services/auth.service'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const token = getSessionCookie()
    if (!token) {
      throw new Error('UNAUTHORIZED: Sesi berakhir atau belum masuk.')
    }

    const db = getWorkerDb()
    const user = await resolveSessionUser(db, token)
    if (!user) {
      clearSessionCookie()
      throw new Error('UNAUTHORIZED: Sesi berakhir atau belum masuk.')
    }

    return next({ context: { user, db } })
  },
)

export function requireRoleMiddleware(allowedRoles: readonly UserRole[]) {
  return createMiddleware({ type: 'function' })
    .middleware([authMiddleware])
    .server(async ({ context, next }) => {
      if (!allowedRoles.includes(context.user.role)) {
        throw new Error(
          `FORBIDDEN: Peran '${context.user.title}' tidak memiliki otoritas untuk tindakan ini.`,
        )
      }
      return next()
    })
}
