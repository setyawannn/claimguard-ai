import { Link } from '@tanstack/react-router'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { EmptyState } from '#/components/shared/EmptyState'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatDateId, formatIdr } from '#/lib/format'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import { cn } from '#/lib/utils'
import type {
  PksDecisionRowItem,
  PksDecisionsFilterInput,
  PksDecisionsSummary,
} from '#/schemas/hospitals.schema'
import { RECOMMENDED_POLICY_LABELS } from './kebijakan.utils'

interface KebijakanTableSectionProps {
  items: readonly PksDecisionRowItem[]
  summary: PksDecisionsSummary
  activeTab: PksDecisionsFilterInput['tab']
  selectedDecisionId: string | null
  onTabChange: (tab: PksDecisionsFilterInput['tab']) => void
  onSelect: (decisionId: string) => void
}

function getRecommendedToneClass(
  policy: PksDecisionRowItem['recommendedPolicy'],
): string {
  switch (policy) {
    case 'pks_bersyarat':
      return 'border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high-text)]'
    case 'teguran_sp1':
    case 'pembinaan':
      return 'border-[var(--color-risk-medium-border)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium-text)]'
    case 'perpanjang':
      return 'border-[var(--color-risk-low-border)] bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low-text)]'
  }
}

export function KebijakanTableSection({
  items,
  summary,
  activeTab,
  selectedDecisionId,
  onTabChange,
  onSelect,
}: KebijakanTableSectionProps) {
  const tabs: ReadonlyArray<{
    key: PksDecisionsFilterInput['tab']
    label: string
    count: number
  }> = [
    { key: 'semua', label: 'Semua Rekap PKS', count: summary.totalCount },
    {
      key: 'menunggu_rapat',
      label: 'Menunggu Rapat Direksi',
      count: summary.waitingMeetingCount,
    },
    { key: 'final', label: 'Keputusan PKS Final', count: summary.finalCount },
  ]

  return (
    <section className="card-surface flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                isActive
                  ? 'border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]'
                  : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 font-mono-code text-[11px] leading-none',
                  isActive
                    ? 'bg-[var(--color-action-primary)] text-white'
                    : 'bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]',
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="hidden grid-cols-[1.25fr_1fr_1.45fr_1.4fr_118px] items-center gap-3 border-b border-[var(--color-border-default)] px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-text-secondary)] lg:grid">
        <span>FKRTL &amp; Masa PKS</span>
        <span>Skor &amp; Beban TGR</span>
        <span>Rekomendasi → Keputusan PKS</span>
        <span>Catatan Rapat &amp; e-Office</span>
        <span className="text-right">Aksi</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Tidak Ada FKRTL pada Filter Ini"
          description="Coba ubah tab status rapat, jalur kebijakan, atau kata kunci pencarian e-Office."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => {
            const isSelected = selectedDecisionId === item.decisionId
            const tgrValue =
              item.tgrCommitmentIdr > 0
                ? item.tgrCommitmentIdr
                : item.tgrBurdenIdr
            const recommendedText =
              RECOMMENDED_POLICY_LABELS[item.recommendedPolicy]

            return (
              <div
                key={item.decisionId}
                className={cn(
                  'grid grid-cols-1 items-center gap-3 rounded-[14px] border px-3.5 py-3 transition-all lg:grid-cols-[1.25fr_1fr_1.45fr_1.4fr_118px]',
                  isSelected
                    ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)]/35 ring-2 ring-[var(--color-action-primary)]/15'
                    : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-canvas)]/60',
                )}
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelect(item.decisionId)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
                      {item.hospitalName}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[var(--color-text-secondary)]">
                      Tipe {item.facilityType} · PKS{' '}
                      {formatDateId(item.pksExpiresAt)}
                    </p>
                  </button>
                  <Link
                    to="/rapor-rs/$hospitalId"
                    params={{ hospitalId: item.hospitalId }}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-action-primary)] hover:underline"
                  >
                    <span>Rapor 4 Pilar</span>
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => onSelect(item.decisionId)}
                  className="text-left"
                >
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)] tabular-nums">
                    Skor {item.complianceScore} · Grade {item.complianceGrade}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--color-text-secondary)] tabular-nums">
                    {tgrValue > 0 ? `TGR ${formatIdr(tgrValue)}` : 'Rp 0 Temuan'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSelect(item.decisionId)}
                  className="flex flex-wrap items-center gap-1.5 text-left"
                >
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                      getRecommendedToneClass(item.recommendedPolicy),
                    )}
                  >
                    {recommendedText}
                  </span>
                  <ArrowRight
                    className="size-3.5 shrink-0 text-[var(--color-text-secondary)]"
                    aria-hidden="true"
                  />
                  {item.isLocked ? (
                    <StatusBadge meta={PKS_STATUS_META[item.pksStatus]} />
                  ) : (
                    <span className="badge-pill border-[var(--color-border-default)] bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]">
                      Siap Rapat
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onSelect(item.decisionId)}
                  className="min-w-0 text-left"
                >
                  <p className="line-clamp-2 text-[12px] leading-snug text-[var(--color-text-secondary)]">
                    {item.executiveNote ?? 'Menunggu agenda rapat evaluasi PKS.'}
                  </p>
                  {item.eofficeRefNumber && (
                    <p className="mt-1 truncate font-mono-code text-[11px] text-[var(--color-text-primary)]">
                      {item.eofficeRefNumber}
                    </p>
                  )}
                </button>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant={item.isLocked ? 'outlinePill' : 'subtleAction'}
                    onClick={() => onSelect(item.decisionId)}
                    className="rounded-full"
                  >
                    <span>{item.isLocked ? 'Ubah →' : 'Catat Hasil →'}</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
