const PBKDF2_PREFIX = 'pbkdf2_sha256'
const PBKDF2_ITERATIONS = 100_000 // Batas maksimum PBKDF2 pada runtime Cloudflare Workers
const SALT_BYTES = 16
const KEY_BYTES = 32
const SESSION_TOKEN_BYTES = 32

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null
  }
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function derivePbkdf2Bits(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    KEY_BYTES * 8,
  )
  return new Uint8Array(bits)
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(new ArrayBuffer(SALT_BYTES))
  crypto.getRandomValues(salt)
  const derived = await derivePbkdf2Bits(password, salt, PBKDF2_ITERATIONS)
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${toHex(salt)}$${toHex(derived)}`
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split('$')
  if (parts.length !== 4) return false

  const [prefix, iterStr, saltHex, expectedHex] = parts
  if (prefix !== PBKDF2_PREFIX) return false

  const iterations = Number(iterStr)
  if (
    !Number.isInteger(iterations) ||
    iterations < 1 ||
    iterations > PBKDF2_ITERATIONS
  ) {
    return false
  }

  const salt = fromHex(saltHex)
  const expected = fromHex(expectedHex)
  if (!salt || !expected || expected.length !== KEY_BYTES) return false

  const actual = await derivePbkdf2Bits(password, salt, iterations)
  return constantTimeEqual(actual, expected)
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(SESSION_TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

export async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return toHex(new Uint8Array(digest))
}
