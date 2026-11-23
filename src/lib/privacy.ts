export function maskNik(rawNik: string): string {
  const digits = rawNik.replace(/\D/g, '')
  if (digits.length < 10) return '******'
  return `${digits.slice(0, 6)}******${digits.slice(-4)}`
}

export async function hashPatientCard(
  cardNumber: string,
  salt = 'claimguard-uupdp-v1',
): Promise<string> {
  const encoded = new TextEncoder().encode(`${salt}:${cardNumber.trim()}`)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  const hex = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
  return `HASH_${hex.slice(0, 12)}`
}

export function formatPatientLabel(
  alias: string,
  gender: 'L' | 'P',
  age: number,
): string {
  return `${alias} (${gender}, ${age} thn)`
}
