export const DEFAULT_MAX_READS_95 = 4_750_000
export const DEFAULT_MAX_WRITES_95 = 95_000

const KV_SYNC_INTERVAL_MS = 10_000
const BURST_READ_FLUSH = 2_500
const BURST_WRITE_FLUSH = 250

interface D1UsageCounters {
  reads: number
  writes: number
}

interface D1MetaShape {
  meta?: {
    rows_read?: number
    rows_written?: number
  }
}

export interface D1GuardOptions {
  maxReads?: number
  maxWrites?: number
}

let activeDayKey = ''
let localReads = 0
let localWrites = 0
let lastSyncTime = 0

function getTodayKey(): string {
  const dateStr = new Date().toISOString().split('T')[0]
  return `d1_usage:${dateStr}`
}

function resetIfNewUtcDay(todayKey: string): void {
  if (activeDayKey !== todayKey) {
    activeDayKey = todayKey
    localReads = 0
    localWrites = 0
    lastSyncTime = 0
  }
}

export function resetLocalD1GuardState(): void {
  activeDayKey = ''
  localReads = 0
  localWrites = 0
  lastSyncTime = 0
}

export function getLocalD1Usage(): D1UsageCounters {
  resetIfNewUtcDay(getTodayKey())
  return { reads: localReads, writes: localWrites }
}

// KV opsional agar dev lokal tanpa binding USAGE_KV tetap berjalan.
export function createGuardedD1(
  db: D1Database,
  kv?: KVNamespace,
  options?: D1GuardOptions,
): D1Database {
  const maxReads = options?.maxReads ?? DEFAULT_MAX_READS_95
  const maxWrites = options?.maxWrites ?? DEFAULT_MAX_WRITES_95

  const checkAndRecord = async <T>(
    executeFn: () => Promise<T>,
    isWriteIntent = false,
  ): Promise<T> => {
    const key = getTodayKey()
    resetIfNewUtcDay(key)

    const now = Date.now()

    if (kv && now - lastSyncTime > KV_SYNC_INTERVAL_MS) {
      const stored = await kv.get<D1UsageCounters>(key, 'json')
      if (stored) {
        localReads = Math.max(localReads, stored.reads)
        localWrites = Math.max(localWrites, stored.writes)
      }
      lastSyncTime = now
    }

    if (localReads >= maxReads || (isWriteIntent && localWrites >= maxWrites)) {
      throw new Error(
        'D1_QUOTA_GUARD: Batas harian 95% tercapai. Koneksi diputus.',
      )
    }

    const result = await executeFn()

    const meta = Array.isArray(result)
      ? result.reduce<D1UsageCounters>(
          (acc, row: D1MetaShape) => ({
            reads: acc.reads + (row?.meta?.rows_read ?? 0),
            writes: acc.writes + (row?.meta?.rows_written ?? 0),
          }),
          { reads: 0, writes: 0 },
        )
      : {
          reads: (result as D1MetaShape)?.meta?.rows_read ?? 0,
          writes: (result as D1MetaShape)?.meta?.rows_written ?? 0,
        }

    localReads += meta.reads
    localWrites += meta.writes

    if (
      kv &&
      (localReads >= maxReads ||
        localWrites >= maxWrites ||
        meta.reads > BURST_READ_FLUSH ||
        meta.writes > BURST_WRITE_FLUSH)
    ) {
      await kv.put(
        key,
        JSON.stringify({ reads: localReads, writes: localWrites }),
        { expirationTtl: 86_400 },
      )
    }

    return result
  }

  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === 'batch') {
        return (statements: D1PreparedStatement[]) =>
          checkAndRecord(() => target.batch(statements), true)
      }
      if (prop === 'prepare') {
        return (query: string) => {
          const stmt = target.prepare(query)
          const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(
            query,
          )

          return new Proxy(stmt, {
            get(sTarget, sProp) {
              if (['all', 'run', 'first', 'raw'].includes(String(sProp))) {
                return (...args: unknown[]) =>
                  checkAndRecord(
                    () =>
                      (
                        sTarget[sProp as keyof D1PreparedStatement] as (
                          ...a: unknown[]
                        ) => Promise<unknown>
                      )(...args),
                    isWrite,
                  )
              }
              const value = Reflect.get(sTarget, sProp)
              return typeof value === 'function' ? value.bind(sTarget) : value
            },
          })
        }
      }
      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}
