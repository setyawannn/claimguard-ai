import { Link, useRouterState } from '@tanstack/react-router'
import { ShieldCheck } from 'lucide-react'
import {
  PERSONA_BY_ROLE,
  type SessionUser,
  type UserRole,
} from '#/schemas/session.schema'
import { useSwitchRoleMutation } from '#/queries/session.queries'
import { cn } from '#/lib/utils'

interface NavItem {
  label: string
  to: string
  badge?: number
}

const NAV_BY_ROLE: Record<UserRole, readonly NavItem[]> = {
  verifikator: [
    { label: 'Dashboard', to: '/' },
    { label: 'Antrean', to: '/antrean', badge: 780 },
    { label: 'Riwayat', to: '/riwayat' },
  ],
  auditor_wilayah: [
    { label: 'Dashboard', to: '/' },
    { label: 'Investigasi', to: '/investigasi', badge: 14 },
    { label: 'Tindak Lanjut', to: '/tindak-lanjut' },
  ],
  kepala_cabang: [
    { label: 'Dashboard', to: '/' },
    { label: 'Rapor Kepatuhan RS', to: '/rapor-rs', badge: 3 },
    { label: 'Kebijakan PKS', to: '/kebijakan' },
  ],
}

interface TopNavbarProps {
  user: SessionUser
}

export function TopNavbar({ user }: TopNavbarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const switchRole = useSwitchRoleMutation()
  const navItems = NAV_BY_ROLE[user.role]

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-6">
        {/* Kiri: Brand + Identitas Unit (KC Malang / Divre Jatim) */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[var(--color-text-primary)] no-underline"
          >
            <span className="flex size-8 items-center justify-center rounded-[var(--radius-node)] bg-[var(--color-action-primary)] text-[var(--color-text-on-primary)]">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              ClaimGuard AI
            </span>
          </Link>
          <span className="badge-pill border-[var(--color-border-default)] bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]">
            {user.unitName}
          </span>
        </div>

        {/* Tengah: 3 Menu Pills RBAC */}
        <nav aria-label="Navigasi Utama" className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? pathname === '/'
                : pathname.startsWith(item.to)

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold no-underline transition-colors',
                  isActive
                    ? 'border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]',
                )}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 font-mono-code text-[10px]',
                      isActive
                        ? 'bg-[var(--color-action-primary)] text-[var(--color-text-on-primary)]'
                        : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Kanan: Role Switcher + Profil Persona */}
        <div className="flex items-center gap-3">
          <label htmlFor="role-switcher" className="sr-only">
            Pilih Peran Pengawasan
          </label>
          <select
            id="role-switcher"
            value={user.role}
            disabled={switchRole.isPending}
            onChange={(e) => switchRole.mutate(e.target.value as UserRole)}
            className="h-9 rounded-[var(--radius-node)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 text-[13px] font-medium text-[var(--color-text-primary)] focus:border-[var(--color-action-primary)] focus:outline-none"
          >
            {(Object.keys(PERSONA_BY_ROLE) as UserRole[]).map((roleKey) => {
              const p = PERSONA_BY_ROLE[roleKey]
              return (
                <option key={roleKey} value={roleKey}>
                  {p.name} — {p.title}
                </option>
              )
            })}
          </select>
        </div>
      </div>
    </header>
  )
}
