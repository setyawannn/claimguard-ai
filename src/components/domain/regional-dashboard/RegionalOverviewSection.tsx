import { Link, useRouter } from '@tanstack/react-router'
import { ClaimPriorityRow } from '#/components/shared/ClaimPriorityRow'
import { EmptyState } from '#/components/shared/EmptyState'
import { FaskesAnomalyRow } from '#/components/shared/FaskesAnomalyRow'
import { RiskScoreBadge } from '#/components/shared/RiskScoreBadge'
import { SectionCard } from '#/components/shared/SectionCard'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatIdr } from '#/lib/format'
import { RISK_ZONE_META } from '#/lib/status-tokens'
import type { RiskZone } from '#/lib/status-tokens'
import type {
  BranchEscalationSummary,
  RegionalClusterItem,
} from '#/schemas/clusters.schema'

interface RegionalOverviewSectionProps {
  clusters: readonly RegionalClusterItem[]
  branches: readonly BranchEscalationSummary[]
  totalClustersCount: number
  selectedBranchCode?: string
  onToggleBranch: (branchCode: string) => void
}

function getBranchRiskZone(branch: BranchEscalationSummary): RiskZone {
  if (branch.criticalCount >= 2 || branch.clusterCount >= 4) return 'merah'
  if (branch.clusterCount >= 3) return 'kuning'
  return 'hijau'
}

export function RegionalOverviewSection({
  clusters,
  branches,
  totalClustersCount,
  selectedBranchCode,
  onToggleBranch,
}: RegionalOverviewSectionProps) {
  const router = useRouter()
  const visibleClusters = clusters.slice(0, 6)

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <SectionCard
        title="Kluster Faskes Prioritas Utama"
        subtitle="Kluster RS dengan eskalasi penolakan tertinggi & indikasi kolusi rujukan."
        className="lg:col-span-7 xl:col-span-8"
        action={
          <Button
            asChild
            variant="outlinePill"
            size="sm"
            className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
          >
            <Link to="/investigasi">
              Lihat Semua Kluster ({totalClustersCount})
            </Link>
          </Button>
        }
      >
        {visibleClusters.length === 0 ? (
          <EmptyState
            title="Tidak ada kluster yang cocok"
            description="Ubah pilihan Kantor Cabang atau kata kunci pencarian pada bilah filter."
          />
        ) : (
          visibleClusters.map((item) => {
            const isReadySidak = item.followupStage === 'sidak_fisik'
            return (
              <ClaimPriorityRow
                key={item.id}
                badge={
                  isReadySidak ? (
                    <StatusBadge
                      meta={{
                        label: 'Siap Sidak',
                        badgeClass:
                          'bg-[var(--color-action-primary-bg)] border-[var(--color-action-primary-border)] text-[var(--color-action-primary)]',
                        dotClass: 'bg-[var(--color-action-primary)]',
                      }}
                    />
                  ) : (
                    <RiskScoreBadge score={item.riskScore} />
                  )
                }
                title={item.title}
                meta={`${item.branchName} · ${item.summaryNote}`}
                amountText={formatIdr(item.potentialLossIdr)}
                actionLabel={isReadySidak ? 'Tindak Lanjut' : 'Telusuri'}
                onAction={() => {
                  if (isReadySidak) {
                    void router.navigate({
                      to: '/tindak-lanjut',
                      search: { clusterId: item.id },
                    })
                    return
                  }
                  void router.navigate({
                    to: '/investigasi',
                    search: {
                      clusterId: item.id,
                      branchCode: item.branchCode,
                    },
                  })
                }}
              />
            )
          })
        )}
      </SectionCard>

      <SectionCard
        title="Eskalasi per Kantor Cabang"
        subtitle="Klik Kantor Cabang untuk menyaring kluster faskes."
        className="lg:col-span-5 xl:col-span-4"
      >
        {branches.map((branch) => {
          const zone = getBranchRiskZone(branch)
          return (
            <FaskesAnomalyRow
              key={branch.branchCode}
              hospitalName={`${branch.branchName} (${branch.hospitalCountLabel})`}
              meta={branch.dominantSummary}
              active={selectedBranchCode === branch.branchCode}
              onClick={() => onToggleBranch(branch.branchCode)}
              badge={
                <StatusBadge
                  meta={{
                    label: `${branch.clusterCount} Kluster`,
                    badgeClass: RISK_ZONE_META[zone].badgeClass,
                    dotClass: RISK_ZONE_META[zone].dotClass,
                  }}
                />
              }
            />
          )
        })}
      </SectionCard>
    </section>
  )
}
