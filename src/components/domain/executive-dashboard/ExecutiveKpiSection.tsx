import { Link } from '@tanstack/react-router'
import { Calendar, Check, FileText } from 'lucide-react'
import { KpiCard } from '#/components/shared/KpiCard'
import { ProgressMetricBar } from '#/components/shared/ProgressMetricBar'
import { VolumeTrendChart } from '#/components/shared/VolumeTrendChart'
import { Button } from '#/components/ui/button'
import { formatIdrCompact, formatPercent } from '#/lib/format'
import type { ExecutiveDashboardMetrics } from '#/schemas/hospitals.schema'

interface ExecutiveKpiSectionProps {
  metrics: ExecutiveDashboardMetrics
  unitName: string
}

export function ExecutiveKpiSection({
  metrics,
  unitName,
}: ExecutiveKpiSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Dana JKN Diamankan"
        value={formatIdrCompact(metrics.fundsSecuredIdr)}
        valueSize="24"
        subtitle={`${formatIdrCompact(metrics.costAvoidanceIdr)} Cost Avoidance + ${formatIdrCompact(metrics.totalTgrIdr)} TGR`}
        badge={
          <span className="badge-pill border-[var(--color-risk-low-border)] bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low-text)]">
            <span className="size-1.5 rounded-full bg-[var(--color-risk-low)]" />
            +24%
          </span>
        }
        footer={<VolumeTrendChart points={metrics.trend} />}
      />

      <KpiCard
        focal
        title="Evaluasi PKS"
        value={`${metrics.needEvaluationCount} RS Perlu Evaluasi PKS`}
        subtitle={`Eskalasi Pengawas Wilayah & Verifikator: ${metrics.sp1AndEvaluasiCount} Evaluasi/SP-1 & ${metrics.pembinaanCount} Pembinaan Koding.`}
        leadingIcon={
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
            <Check className="size-4 text-white" />
          </span>
        }
        badge={
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#1D4ED8]">
            Rekomendasi Kebijakan
          </span>
        }
        footer={
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-[11px] font-semibold text-white">
              {metrics.totalHospitals} FKRTL Mitra {unitName}
            </span>
            <Button
              asChild
              variant="whiteFocal"
              size="sm"
              className="text-[12px] font-semibold"
            >
              <Link to="/rapor-rs">Tinjau Rapor RS →</Link>
            </Button>
          </div>
        }
      />

      <KpiCard
        title="Sebaran 4 Tipologi Fraud"
        value="4 Tipologi"
        inlineSubtitle={`${formatIdrCompact(metrics.fundsSecuredIdr)} Potensi`}
        badge={
          <span className="badge-pill border-[var(--color-risk-medium-border)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium-text)]">
            <span className="size-1.5 rounded-full bg-[var(--color-risk-medium)]" />
            PMK 16/2019
          </span>
        }
        footer={
          <div className="space-y-3 pt-1">
            <ProgressMetricBar
              dot
              tone="high"
              label="Repeat & Phantom Billing"
              valueText={`${metrics.repeatPhantomPct}%`}
              percent={metrics.repeatPhantomPct}
            />
            <ProgressMetricBar
              dot
              tone="medium"
              label="Upcoding & Unbundling"
              valueText={`${metrics.upcodingUnbundlingPct}%`}
              percent={metrics.upcodingUnbundlingPct}
            />
          </div>
        }
      />

      <KpiCard
        title="Kinerja SLA & Fast-Track"
        value={formatPercent(metrics.fastTrackPct)}
        inlineSubtitle="Fast-Track < 3 Hari"
        badge={
          <span className="badge-pill border-[var(--color-risk-low-border)] bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low-text)]">
            <span className="size-1.5 rounded-full bg-[var(--color-risk-low)]" />
            SLA {formatPercent(metrics.slaPct)}
          </span>
        }
        footer={
          <div className="space-y-3 pt-1">
            <ProgressMetricBar
              tone="primary"
              label={`${metrics.fastTrackCount} SEP Bersih Cair Cepat`}
              valueText={formatPercent(metrics.fastTrackPct)}
              percent={metrics.fastTrackPct}
              leadingIcon={
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)]">
                  <FileText className="size-3.5" />
                </span>
              }
            />
            <ProgressMetricBar
              tone="medium"
              label="Arus Kas RS Patuh Terjaga"
              valueText={`${formatPercent(metrics.slaPct)} SLA`}
              percent={metrics.slaPct}
              leadingIcon={
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-risk-medium-border)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)]">
                  <Calendar className="size-3.5" />
                </span>
              }
            />
          </div>
        }
      />
    </section>
  )
}
