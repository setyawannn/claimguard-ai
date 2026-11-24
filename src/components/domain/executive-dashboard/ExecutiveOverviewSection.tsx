import { Link, useRouter } from '@tanstack/react-router'
import { ClaimPriorityRow } from '#/components/shared/ClaimPriorityRow'
import { EmptyState } from '#/components/shared/EmptyState'
import { FaskesAnomalyRow } from '#/components/shared/FaskesAnomalyRow'
import { SectionCard } from '#/components/shared/SectionCard'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatIdrCompact, formatPercent } from '#/lib/format'
import { RISK_ZONE_META } from '#/lib/status-tokens'
import type { RiskZone } from '#/lib/status-tokens'
import type {
  ExecutiveHospitalScoreItem,
  ExecutiveTypologySummary,
} from '#/schemas/hospitals.schema'
import { getPksStatusLabel } from './executive-dashboard.utils'

interface ExecutiveOverviewSectionProps {
  priorityHospitals: readonly ExecutiveHospitalScoreItem[]
  totalHospitalsCount: number
  typologies: readonly ExecutiveTypologySummary[]
}

function getScoreZone(score: number): RiskZone {
  if (score >= 85) return 'hijau'
  if (score >= 70) return 'kuning'
  return 'merah'
}

export function ExecutiveOverviewSection({
  priorityHospitals,
  totalHospitalsCount,
  typologies,
}: ExecutiveOverviewSectionProps) {
  const router = useRouter()
  const visibleHospitals = priorityHospitals.slice(0, 5)

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <SectionCard
        title="Rapor Kepatuhan RS Mitra & Rekomendasi PKS"
        subtitle="Perbandingan skor kepatuhan, keterisian kasur (BOR), dan rekomendasi kebijakan kontrak."
        className="lg:col-span-7 xl:col-span-8"
        action={
          <Button
            asChild
            variant="outlinePill"
            size="sm"
            className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
          >
            <Link to="/rapor-rs">
              Lihat Semua Mitra ({totalHospitalsCount})
            </Link>
          </Button>
        }
      >
        {visibleHospitals.length === 0 ? (
          <EmptyState
            title="Tidak ada FKRTL mitra yang cocok"
            description="Ubah pilihan rumah sakit atau kata kunci pencarian pada bilah filter."
          />
        ) : (
          visibleHospitals.map((hospital) => {
            const zone = getScoreZone(hospital.complianceScore)
            const pksLabel = getPksStatusLabel(hospital.pksStatus)
            const actionLabel =
              hospital.pksStatus === 'evaluasi_pks'
                ? 'Evaluasi PKS'
                : hospital.complianceScore >= 85
                  ? 'Lihat Detail'
                  : 'Tinjau Rapor'

            return (
              <ClaimPriorityRow
                key={hospital.id}
                badge={
                  <StatusBadge
                    meta={{
                      label: `Skor ${hospital.complianceScore}/100`,
                      badgeClass: RISK_ZONE_META[zone].badgeClass,
                      dotClass: RISK_ZONE_META[zone].dotClass,
                    }}
                  />
                }
                title={`${hospital.name} (Tipe ${hospital.facilityType} · ${pksLabel})`}
                meta={`BOR ${formatPercent(hospital.borTotalPct)} · ${hospital.dominantTypology}`}
                amountText={
                  hospital.tgrBurdenIdr > 0
                    ? `TGR ${formatIdrCompact(hospital.tgrBurdenIdr)}`
                    : hospital.complianceScore >= 90
                      ? 'Mitra Teladan'
                      : pksLabel
                }
                actionLabel={actionLabel}
                onAction={() => {
                  void router.navigate({
                    to: '/rapor-rs/$hospitalId',
                    params: { hospitalId: hospital.id },
                  })
                }}
              />
            )
          })
        )}
      </SectionCard>

      <SectionCard
        title="Evaluasi 4 Tipologi Fraud"
        subtitle="Proporsi modus temuan sebagai dasar kebijakan pembinaan FKRTL."
        className="lg:col-span-5 xl:col-span-4"
      >
        {typologies.map((item) => (
          <FaskesAnomalyRow
            key={item.key}
            hospitalName={item.title}
            meta={`${item.caseCount} Kasus · ${item.subtitle}`}
            badge={
              <StatusBadge
                meta={{
                  label: `${item.percentShare}% · ${formatIdrCompact(item.amountIdr)}`,
                  badgeClass: RISK_ZONE_META[item.zone].badgeClass,
                  dotClass: RISK_ZONE_META[item.zone].dotClass,
                }}
              />
            }
          />
        ))}
      </SectionCard>
    </section>
  )
}
