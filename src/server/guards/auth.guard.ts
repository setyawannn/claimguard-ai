import { env } from 'cloudflare:workers'
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'
import { getDb, type AppDatabase, type DbEnvBindings } from '#/db'

const SESSION_COOKIE_NAME = 'cg_session'
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

export function getWorkerDb(): AppDatabase {
  return getDb(env as unknown as DbEnvBindings)
}

export function getWorkerAiEnv(): { apiKey?: string; model?: string } {
  const bindings = env as unknown as Record<string, string | undefined>
  return {
    apiKey: bindings.GEMINI_API_KEY,
    model: bindings.GEMINI_MODEL,
  }
}

export function getSessionCookie(): string | undefined {
  return getCookie(SESSION_COOKIE_NAME)
}

export function setSessionCookie(token: string): void {
  setCookie(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

export function clearSessionCookie(): void {
  deleteCookie(SESSION_COOKIE_NAME, { path: '/' })
}
