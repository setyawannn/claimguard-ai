import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { RiskScoreBadge } from '#/components/shared/RiskScoreBadge'
import { CLAIM_STATUS_META } from '#/lib/status-tokens'
import { sessionQueryOptions } from '#/queries/session.queries'

export const Route = createFileRoute('/')({
  component: HomeDashboardShell,
})

function HomeDashboardShell() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions())

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-[var(--color-text-primary)]">
            Selamat Datang, {user.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {user.title} · {user.unitName} · Data sintetis kepatuhan UU PDP No.
            27/2022
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RiskScoreBadge score={88} />
          <StatusBadge meta={CLAIM_STATUS_META.belum_dicek} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="focal-card rounded-[var(--radius-card)] p-6">
          <p className="text-caption-tag uppercase opacity-85">
            Fondasi Arsitektur Aktif
          </p>
          <p className="text-h2 mt-2">Cloudflare D1 + TanStack Query</p>
          <p className="mt-2 text-sm opacity-90">
            Shell navigasi 3 peran, validasi Zod, RBAC session cookie, dan
            D1 Quota Guard 95% sudah siap digunakan untuk fase seeding &amp;
            implementasi modul halaman.
          </p>
        </div>
        <div className="external-boundary rounded-[var(--radius-card)] p-6">
          <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
            Batas Sistem Luar Aplikasi (Human-in-the-Loop)
          </p>
          <p className="text-h3 mt-2 text-[var(--color-text-primary)]">
            e-Office BPJS · SP2D Keuangan · Sidak Lapangan
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            ClaimGuard AI tidak mengeksekusi penolakan atau pembayaran otonom.
            Semua korespondensi resmi tetap melalui aparatur manusia.
          </p>
        </div>
      </div>
    </section>
  )
}
