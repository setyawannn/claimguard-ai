import { Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ClaimPriorityRow } from '#/components/shared/ClaimPriorityRow'
import { EmptyState } from '#/components/shared/EmptyState'
import { FaskesAnomalyRow } from '#/components/shared/FaskesAnomalyRow'
import { RiskScoreBadge } from '#/components/shared/RiskScoreBadge'
import { SectionCard } from '#/components/shared/SectionCard'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatIdr } from '#/lib/format'
import { RISK_ZONE_META } from '#/lib/status-tokens'
import type { UserRole } from '#/schemas/session.schema'
import {
  DASHBOARD_HOSPITALS,
  type PriorityCase,
} from './dashboard.data'

interface DashboardOverviewSectionProps {
  cases: readonly PriorityCase[]
  manualClaimsCount: number
  selectedHospitalId: string
  userRole: UserRole
  onToggleHospital: (id: string) => void
}

export function DashboardOverviewSection({
  cases,
  manualClaimsCount,
  selectedHospitalId,
  userRole,
  onToggleHospital,
}: DashboardOverviewSectionProps) {
  const router = useRouter()

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <SectionCard
        title="Kasus Prioritas Utama Hari Ini"
        subtitle="Klaim skor tertinggi & balasan klarifikasi RS yang siap diputuskan."
        className="lg:col-span-7 xl:col-span-8"
        action={
          userRole === 'verifikator' ? (
            <Button
              asChild
              variant="outlinePill"
              size="sm"
              className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
            >
              <Link to="/antrean">
                Lihat Semua Antrean ({manualClaimsCount})
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outlinePill"
              size="sm"
              className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
              onClick={() =>
                toast.info(
                  'Menu antrean verifikasi cabang khusus untuk peran Verifikator.',
                )
              }
            >
              Lihat Semua Antrean ({manualClaimsCount})
            </Button>
          )
        }
      >
        {cases.length === 0 ? (
          <EmptyState
            title="Tidak ada kasus yang cocok"
            description="Coba ubah pilihan Rumah Sakit atau kata kunci pencarian pada bilah filter."
          />
        ) : (
          cases.map((item) => (
            <ClaimPriorityRow
              key={item.id}
              badge={
                item.readyToDecide ? (
                  <StatusBadge
                    meta={{
                      label: 'Siap Cek',
                      badgeClass:
                        'bg-[var(--color-action-primary-bg)] border-[var(--color-action-primary-border)] text-[var(--color-action-primary)]',
                      dotClass: 'bg-[var(--color-action-primary)]',
                    }}
                  />
                ) : (
                  <RiskScoreBadge score={item.score} />
                )
              }
              title={item.title}
              meta={item.meta}
              amountText={formatIdr(item.amountIdr)}
              actionLabel={item.readyToDecide ? 'Putuskan' : 'Periksa'}
              onAction={() => {
                if (userRole === 'verifikator') {
                  void router.navigate({
                    to: '/antrean/$claimId',
                    params: { claimId: item.id },
                  })
                  return
                }
                toast.info(`Membuka berkas ${item.sep} (${item.hospitalName})`)
              }}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Anomali per Rumah Sakit"
        subtitle="Klik RS untuk menyaring antrean klaim."
        className="lg:col-span-5 xl:col-span-4"
      >
        {DASHBOARD_HOSPITALS.map((h) => (
          <FaskesAnomalyRow
            key={h.id}
            hospitalName={h.name}
            meta={h.meta}
            active={selectedHospitalId === h.id}
            onClick={() => onToggleHospital(h.id)}
            badge={
              <StatusBadge
                meta={{
                  label: h.anomalyLabel,
                  badgeClass: RISK_ZONE_META[h.zone].badgeClass,
                  dotClass: RISK_ZONE_META[h.zone].dotClass,
                }}
              />
            }
          />
        ))}
      </SectionCard>
    </section>
  )
}
