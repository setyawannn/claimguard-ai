import { Link, useRouterState } from '@tanstack/react-router'
import { Bell, ChevronDown, LogOut, ShieldCheck } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'
import { useLogoutMutation } from '#/queries/session.queries'
import type { SessionUser, UserRole } from '#/schemas/session.schema'

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
    { label: 'Kebijakan & PKS', to: '/kebijakan' },
  ],
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

interface TopNavbarProps {
  user: SessionUser
}

export function TopNavbar({ user }: TopNavbarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const logout = useLogoutMutation()
  const navItems = NAV_BY_ROLE[user.role]

  return (
    <header className="card-surface flex min-h-16 flex-wrap items-center justify-between gap-4 px-5 py-2.5">
      <div className="flex items-center gap-2.5">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[var(--color-text-primary)] no-underline"
        >
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[var(--color-action-primary)] text-white">
            <ShieldCheck className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="text-[16px] font-bold tracking-tight">
            ClaimGuard
          </span>
        </Link>
        <span className="rounded-full border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] px-2.5 py-1 text-[11px] font-semibold leading-none text-[var(--color-action-primary)]">
          {user.unitName}
        </span>
      </div>

      <nav
        aria-label="Navigasi Utama"
        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-1"
      >
        {navItems.map((item) => {
          const isActive =
            item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] no-underline transition-colors',
                isActive
                  ? 'bg-[var(--color-action-primary)] font-semibold text-white'
                  : 'font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-mono-code text-[10px] leading-none',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high)]',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Notifikasi Eskalasi"
              className="relative flex size-9 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
            >
              <Bell className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifikasi Pengawasan</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-xs leading-relaxed">
              Belum ada notifikasi baru — sistem memantau antrean aktif secara
              berkala.
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={logout.isPending}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 text-left transition-colors hover:bg-[var(--color-bg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary)]"
            >
              <Avatar className="size-9 border border-[var(--color-action-primary-border)]">
                <AvatarFallback className="bg-[var(--color-action-primary-bg)] text-[12px] font-bold text-[var(--color-action-primary)]">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-[13px] font-bold leading-tight text-[var(--color-text-primary)]">
                  {user.name}
                </p>
                <p className="text-[11px] leading-tight text-[var(--color-text-secondary)]">
                  {user.title}
                </p>
              </div>
              <ChevronDown
                className="size-3.5 text-[var(--color-text-secondary)]"
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="space-y-1 font-normal">
              <p className="text-[13px] font-bold text-[var(--color-text-primary)]">
                {user.name}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {user.email}
              </p>
              <p className="pt-0.5 text-[11px] font-semibold text-[var(--color-action-primary)]">
                {user.title} · {user.unitName}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => logout.mutate()}
              disabled={logout.isPending}
              className="flex items-center gap-2 text-[var(--color-risk-high)] focus:bg-[var(--color-risk-high-bg)] focus:text-[var(--color-risk-high-text)]"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span>{logout.isPending ? 'Keluar...' : 'Keluar'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
