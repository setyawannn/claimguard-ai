import { createServerFn } from '@tanstack/react-start'
import { switchRoleInputSchema } from '#/schemas/session.schema'
import { getActiveSession, setActiveRoleCookie } from '#/server/guards/auth.guard'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getActiveSession()
  },
)

export const switchRoleFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => switchRoleInputSchema.parse(data))
  .handler(async ({ data }) => {
    return setActiveRoleCookie(data.role)
  })
