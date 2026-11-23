import { Link } from '@tanstack/react-router'
import { Calendar, Check, FileText } from 'lucide-react'
import { KpiCard } from '#/components/shared/KpiCard'
import { ProgressMetricBar } from '#/components/shared/ProgressMetricBar'
import { VolumeTrendChart } from '#/components/shared/VolumeTrendChart'
import { Button } from '#/components/ui/button'
import { formatIdrCompact } from '#/lib/format'
import type { RegionalDashboardMetrics } from '#/schemas/clusters.schema'

interface RegionalKpiSectionProps {
  metrics: RegionalDashboardMetrics
  branchCount: number
  selectedBranchName?: string
}

export function RegionalKpiSection({
  metrics,
  branchCount,
  selectedBranchName,
}: RegionalKpiSectionProps) {
  const safeTotal = Math.max(1, metrics.totalClusters)
  const collusionPct = Math.round((metrics.collusionRepeatCount / safeTotal) * 100)
  const borPct = Math.round((metrics.borUpcodingCount / safeTotal) * 100)
  const sidakPct = Math.round((metrics.readySidakCount / safeTotal) * 100)
  const tgrPct = Math.round((metrics.tgrMonitoringCount / safeTotal) * 100)

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Eskalasi Masuk Cabang"
        value={formatIdrCompact(metrics.totalPotentialLossIdr)}
        valueSize="24"
        subtitle={
          selectedBranchName
            ? `Akumulasi klaim ditolak dari ${selectedBranchName}`
            : `Akumulasi klaim ditolak dari ${branchCount} Kantor Cabang`
        }
        badge={
          <span className="badge-pill border-[var(--color-border-default)] bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]">
            <span className="size-1.5 rounded-full bg-[var(--color-text-secondary)]" />
            {metrics.totalEscalatedClaims.toLocaleString('id-ID')} Berkas
          </span>
        }
        footer={<VolumeTrendChart points={metrics.trend} />}
      />

      <KpiCard
        focal
        title="Kluster Faskes Kritis"
        value={`${metrics.criticalCount.toLocaleString('id-ID')} Kluster Faskes Kritis`}
        subtitle="Terdeteksi pola rujukan berulang lintas RS & klaim melampaui kapasitas kasur."
        leadingIcon={
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
            <Check className="size-4 text-white" />
          </span>
        }
        badge={
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#1D4ED8]">
            Prioritas Audit Wilayah
          </span>
        }
        footer={
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-[11px] font-semibold text-white">
              Potensi {formatIdrCompact(metrics.criticalPotentialLossIdr)}
            </span>
            <Button
              asChild
              variant="whiteFocal"
              size="sm"
              className="text-[12px] font-semibold"
            >
              <Link to="/investigasi">Telusuri Kluster →</Link>
            </Button>
          </div>
        }
      />

      <KpiCard
        title="Pola Temuan Wilayah"
        value={`${metrics.totalClusters} Kluster`}
        inlineSubtitle={`${metrics.criticalCount} Kritis & ${metrics.attentionCount} Perhatian`}
        badge={
          <span className="badge-pill border-[var(--color-risk-medium-border)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium-text)]">
            <span className="size-1.5 rounded-full bg-[var(--color-risk-medium)]" />
            {metrics.totalClusters} Kluster
          </span>
        }
        footer={
          <div className="space-y-3 pt-1">
            <ProgressMetricBar
              dot
              tone="high"
              label="Kolusi Rujukan & Repeat Billing"
              valueText={`${metrics.collusionRepeatCount} Kluster`}
              percent={collusionPct}
            />
            <ProgressMetricBar
              dot
              tone="medium"
              label="Kapasitas Kasur (BOR) & Upcoding"
              valueText={`${metrics.borUpcodingCount} Kluster`}
              percent={borPct}
            />
          </div>
        }
      />

      <KpiCard
        title="Progres Tindak Lanjut"
        value={`${metrics.readySidakCount} Siap Sidak`}
        inlineSubtitle="Surat Tugas (SPT)"
        badge={
          <span className="badge-pill border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)]">
            <span className="size-1.5 rounded-full bg-[var(--color-action-primary)]" />
            {metrics.totalClusters} Aktif
          </span>
        }
        footer={
          <div className="space-y-3 pt-1">
            <ProgressMetricBar
              tone="primary"
              label={`${metrics.readySidakCount} Kluster Siap Sidak`}
              valueText="Bukti Lengkap"
              percent={sidakPct}
              leadingIcon={
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)]">
                  <FileText className="size-3.5" />
                </span>
              }
            />
            <ProgressMetricBar
              tone="medium"
              label={`${metrics.tgrMonitoringCount} Dalam Pemantauan TGR`}
              valueText="Proses Cabang"
              percent={tgrPct}
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
