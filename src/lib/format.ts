const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

const idrFormatter = new Intl.NumberFormat('id-ID')

export function formatIdr(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}Rp ${idrFormatter.format(Math.abs(Math.round(amount)))}`
}

export function formatIdrCompact(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')
    return `${sign}Rp ${val.replace('.', ',')} Miliar`
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return `${sign}Rp ${val.replace('.', ',')} Jt`
  }
  return formatIdr(amount)
}

export function formatDateId(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d || m < 1 || m > 12) return isoDate
  return `${d} ${MONTHS_ID[m - 1]} ${y}`
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace(/\.0$/, '').replace('.', ',')}%`
}

export function formatSlaRemaining(
  slaDueAtIso: string,
  nowMs = Date.now(),
): string {
  const diffMs = new Date(slaDueAtIso).getTime() - nowMs
  if (Number.isNaN(diffMs)) return 'SLA -'
  if (diffMs <= 0) return 'SLA Habis'

  const hours = Math.ceil(diffMs / 3_600_000)
  if (hours < 48) return `Sisa ${hours} jam`
  const days = Math.ceil(hours / 24)
  return `SLA ${days} hr`
}

export function formatThousandsId(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('clipboard' in navigator)) {
    return false
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
