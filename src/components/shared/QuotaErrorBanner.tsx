import { AlertTriangle } from 'lucide-react'

interface QuotaErrorBannerProps {
  error: unknown
}

export function QuotaErrorBanner({ error }: QuotaErrorBannerProps) {
  const message =
    error instanceof Error
      ? error.message
      : 'Terjadi gangguan sementara saat memuat data.'

  const isQuotaGuard =
    message.includes('D1_QUOTA_GUARD') || message.includes('R2_QUOTA_GUARD')

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] p-4 text-[var(--color-risk-high-text)]"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="space-y-1 text-sm">
        <p className="font-semibold">
          {isQuotaGuard
            ? 'Pelindung Kuota Harian 95% Aktif'
            : 'Permintaan Tidak Dapat Diproses'}
        </p>
        <p className="text-[13px] opacity-90">{message}</p>
      </div>
    </div>
  )
}
