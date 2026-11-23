import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { QuotaErrorBanner } from '#/components/shared/QuotaErrorBanner'
import { Button } from '#/components/ui/button'
import { parseAppError } from '#/lib/route-guards'

export function RootNotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card-surface w-full max-w-md space-y-4 p-6 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] font-mono-code text-sm font-bold text-[var(--color-action-primary)]">
          404
        </span>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Tautan yang Anda tuju tidak tersedia atau sudah dipindahkan.
          </p>
        </div>
        <Button asChild className="bg-[var(--color-action-primary)] text-white">
          <Link to="/">Kembali ke Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

export function RootErrorFallback({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const parsed = parseAppError(error)

  if (parsed.code === 'D1_QUOTA_GUARD' || parsed.code === 'R2_QUOTA_GUARD') {
    return (
      <div className="mx-auto mt-12 max-w-xl px-4">
        <QuotaErrorBanner error={error} />
      </div>
    )
  }

  const isForbidden = parsed.code === 'FORBIDDEN'
  const isUnauthorized = parsed.code === 'UNAUTHORIZED'

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card-surface w-full max-w-md space-y-4 p-6 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-full border border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high)]">
          {isForbidden ? (
            <ShieldAlert className="size-5" />
          ) : (
            <AlertCircle className="size-5" />
          )}
        </span>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            {isForbidden
              ? 'Akses Ditolak (403)'
              : isUnauthorized
                ? 'Sesi Berakhir (401)'
                : 'Terjadi Gangguan Sistem'}
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {parsed.message}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isUnauthorized ? (
            <Button asChild className="bg-[var(--color-action-primary)] text-white">
              <Link to="/login">Masuk Kembali</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outlinePill" size="sm">
                <Link to="/">Ke Dashboard</Link>
              </Button>
              {!isForbidden && (
                <Button
                  type="button"
                  size="sm"
                  className="bg-[var(--color-action-primary)] text-white"
                  onClick={() => {
                    reset()
                    void router.invalidate()
                  }}
                >
                  Muat Ulang
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
