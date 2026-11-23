import assert from 'node:assert/strict'
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from './password'

async function run() {
  const hashA = await hashPassword('ClaimGuard2026!')
  const hashB = await hashPassword('ClaimGuard2026!')

  assert.match(hashA, /^pbkdf2_sha256\$100000\$[0-9a-f]{32}\$[0-9a-f]{64}$/)
  assert.notEqual(hashA, hashB)

  assert.equal(await verifyPassword('ClaimGuard2026!', hashA), true)
  assert.equal(await verifyPassword('ClaimGuard2026!', hashB), true)
  assert.equal(await verifyPassword('SalahPassword', hashA), false)
  assert.equal(await verifyPassword('', hashA), false)

  const tampered = `${hashA.slice(0, -2)}${hashA.endsWith('ff') ? '00' : 'ff'}`
  assert.equal(await verifyPassword('ClaimGuard2026!', tampered), false)

  assert.equal(await verifyPassword('ClaimGuard2026!', ''), false)
  assert.equal(await verifyPassword('ClaimGuard2026!', 'invalid'), false)
  assert.equal(
    await verifyPassword('ClaimGuard2026!', 'pbkdf2_sha256$0$aa$bb'),
    false,
  )

  const token1 = generateSessionToken()
  const token2 = generateSessionToken()
  assert.match(token1, /^[0-9a-f]{64}$/)
  assert.notEqual(token1, token2)

  const digest1 = await hashSessionToken(token1)
  const digest1Again = await hashSessionToken(token1)
  assert.match(digest1, /^[0-9a-f]{64}$/)
  assert.equal(digest1, digest1Again)
  assert.notEqual(digest1, token1)

  console.log('auth.check.ts passed')
}

await run()
