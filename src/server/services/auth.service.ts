import { eq } from 'drizzle-orm'
import type { AppDatabase } from '#/db'
import { sessions, users } from '#/db/schema'
import type { SessionUser } from '#/schemas/session.schema'
import {
  generateSessionToken,
  hashSessionToken,
  verifyPassword,
} from '#/server/auth/password'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

function toSessionUser(row: typeof users.$inferSelect): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    unitName: row.unitName,
    branchCode: row.branchCode,
    title: row.title,
  }
}

export async function authenticateUser(
  db: AppDatabase,
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  const userRow = rows[0]
  if (!userRow) return null

  const valid = await verifyPassword(password, userRow.passwordHash)
  if (!valid) return null

  return toSessionUser(userRow)
}

export async function createUserSession(
  db: AppDatabase,
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken()
  const tokenHash = await hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await db.insert(sessions).values({
    id: tokenHash,
    userId,
    expiresAt,
  })

  return { token, expiresAt }
}

export async function resolveSessionUser(
  db: AppDatabase,
  rawToken: string,
): Promise<SessionUser | null> {
  if (!rawToken) return null
  const tokenHash = await hashSessionToken(rawToken)

  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, tokenHash))
    .limit(1)

  const record = rows[0]
  if (!record) return null

  if (record.expiresAt <= new Date()) {
    await db.delete(sessions).where(eq(sessions.id, record.sessionId))
    return null
  }

  return toSessionUser(record.user)
}

export async function revokeSession(
  db: AppDatabase,
  rawToken: string,
): Promise<void> {
  if (!rawToken) return
  const tokenHash = await hashSessionToken(rawToken)
  await db.delete(sessions).where(eq(sessions.id, tokenHash))
}
