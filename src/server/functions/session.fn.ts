import { createServerFn } from '@tanstack/react-start'
import { loginInputSchema } from '#/schemas/session.schema'
import {
  clearSessionCookie,
  getSessionCookie,
  getWorkerDb,
  setSessionCookie,
} from '#/server/guards/auth.guard'
import { authMiddleware } from '#/server/middleware/auth.middleware'
import {
  authenticateUser,
  createUserSession,
  resolveSessionUser,
  revokeSession,
} from '#/server/services/auth.service'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const token = getSessionCookie()
    if (!token) return null

    const user = await resolveSessionUser(getWorkerDb(), token)
    if (!user) {
      clearSessionCookie()
      return null
    }

    return user
  },
)

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => loginInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getWorkerDb()
    const user = await authenticateUser(db, data.email, data.password)
    if (!user) {
      throw new Error('INVALID_CREDENTIALS: Email atau kata sandi salah.')
    }

    const { token } = await createUserSession(db, user.id)
    setSessionCookie(token)
    return user
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const token = getSessionCookie()
    if (token) {
      await revokeSession(context.db, token)
    }
    clearSessionCookie()
    return { ok: true as const }
  })
