import assert from 'node:assert/strict'
import {
  createGuardedD1,
  getLocalD1Usage,
  resetLocalD1GuardState,
} from './d1-guard'

function makeMockD1(rowsRead: number, rowsWritten: number): D1Database {
  const stmt = {
    bind() {
      return this
    },
    async all() {
      return { results: [], success: true, meta: { rows_read: rowsRead, rows_written: rowsWritten } }
    },
    async run() {
      return { results: [], success: true, meta: { rows_read: rowsRead, rows_written: rowsWritten } }
    },
    async first() {
      return { meta: { rows_read: rowsRead, rows_written: rowsWritten } }
    },
    async raw() {
      return []
    },
  }
  return {
    prepare: () => stmt,
    batch: async (stmts: unknown[]) =>
      stmts.map(() => ({
        results: [],
        success: true,
        meta: { rows_read: rowsRead, rows_written: rowsWritten },
      })),
  } as unknown as D1Database
}

async function main() {
  resetLocalD1GuardState()

  let kvPutCount = 0
  const mockKv = {
    async get() {
      return { reads: 2, writes: 1 }
    },
    async put() {
      kvPutCount += 1
    },
  } as unknown as KVNamespace

  const guarded = createGuardedD1(makeMockD1(3, 2), mockKv, {
    maxReads: 5,
    maxWrites: 3,
  })

  // First read pulls KV baseline (2 reads, 1 write) + executes (+3 reads, +2 writes) => 5 reads, 3 writes
  await guarded.prepare('SELECT * FROM hospitals LIMIT 10').all()
  assert.deepEqual(getLocalD1Usage(), { reads: 5, writes: 3 })
  assert.equal(kvPutCount, 1, 'should flush immediately when limit reached')

  // Next query must trip the 95% circuit breaker before touching D1
  await assert.rejects(
    () => guarded.prepare('SELECT * FROM claims LIMIT 10').all(),
    /D1_QUOTA_GUARD/,
  )

  // Separate check: write limit trips INSERT while SELECT below read limit still passes
  resetLocalD1GuardState()
  const writeLimited = createGuardedD1(makeMockD1(1, 5), undefined, {
    maxReads: 100,
    maxWrites: 5,
  })
  await writeLimited.prepare('INSERT INTO users (id) VALUES (?)').run()
  await assert.rejects(
    () => writeLimited.prepare('UPDATE users SET name = ?').run(),
    /D1_QUOTA_GUARD/,
  )
  await writeLimited.prepare('SELECT id FROM users LIMIT 1').all()

  console.log('d1-guard check passed')
}

main()
