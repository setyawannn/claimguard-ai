import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { createGuardedD1 } from './d1-guard'
import * as schema from './schema'

export type AppDatabase = DrizzleD1Database<typeof schema>

export interface DbEnvBindings {
  DB: D1Database
  USAGE_KV?: KVNamespace
}

export function getDb(env: DbEnvBindings): AppDatabase {
  const guarded = createGuardedD1(env.DB, env.USAGE_KV)
  return drizzle(guarded, { schema })
}

export { schema }
