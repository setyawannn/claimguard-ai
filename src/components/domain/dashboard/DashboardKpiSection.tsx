import { Link } from '@tanstack/react-router'
import { Calendar, Check, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { KpiCard } from '#/components/shared/KpiCard'
import { ProgressMetricBar } from '#/components/shared/ProgressMetricBar'
import {
  VolumeTrendChart,
  type VolumeTrendPoint,
} from '#/components/shared/VolumeTrendChart'
import { Button } from '#/components/ui/button'
import { formatIdrCompact } from '#/lib/format'
import type { UserRole } from '#/schemas/session.schema'

export interface DashboardMetrics {
  totalClaims: number
  totalAmountIdr: number
  fastTrackClaims: number
  fastTrackAmountIdr: number
  manualClaims: number
  manualAmountIdr: number
  highRiskCount: number
  mediumRiskCount: number
  trend: VolumeTrendPoint[]
}

interface DashboardKpiSectionProps {
  metrics: DashboardMetrics
  selectedHospitalName?: string
  clarifyReadyCount: number
  clarifyWaitingCount: number
  userRole: UserRole
}

export function DashboardKpiSection({
  metrics,
  selectedHospitalName,
  clarifyReadyCount,
  clarifyWaitingCount,
  userRole,
}: DashboardKpiSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Volume Klaim Masuk"
        value={formatIdrCompact(metrics.totalAmountIdr)}
        valueSize="24"
        subtitle={`Tagihan diajukan ${selectedHospitalName ?? '12 RS'} · Sisa SLA 9 hari kerja`}
        badge={
          <span className="badge-pill border-[var(--color-border-default)] bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)]">
            <span className="size-1.5 rounded-full bg-[var(--color-text-secondary)]" />
            {metrics.totalClaims.toLocaleString('id-ID')} Berkas
          </span>
        }
        footer={<VolumeTrendChart points={metrics.trend} />}
      />

      <KpiCard
        focal
        title="Klaim Siap Cair"
        value={`${metrics.fastTrackClaims.toLocaleString('id-ID')} Klaim Siap Cair`}
        subtitle="85% berkas lolos verifikasi aturan medis & tarif INA-CBG tanpa anomali."
        leadingIcon={
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
            <Check className="size-4 text-white" />
          </span>
        }
        badge={
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#1D4ED8]">
            Skor 0–39 · Wajar
          </span>
        }
        footer={
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-[11px] font-semibold text-white">
              Total {formatIdrCompact(metrics.fastTrackAmountIdr)}
            </span>
            {userRole === 'verifikator' ? (
              <Button
                asChild
                variant="whiteFocal"
                size="sm"
                className="text-[12px] font-semibold"
              >
                <Link to="/antrean">Setujui Sekaligus →</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="whiteFocal"
                size="sm"
                className="text-[12px] font-semibold"
                onClick={() =>
                  toast.info('Otorisasi persetujuan Fast-Track khusus untuk peran Verifikator.')
                }
              >
                Setujui Sekaligus →
              </Button>
            )}
          </div>
        }
      />

      <KpiCard
        title="Perlu Verifikasi Manual"
        value={`${metrics.manualClaims.toLocaleString('id-ID')} Berkas`}
        inlineSubtitle={`${formatIdrCompact(metrics.manualAmountIdr)} tertahan`}
        badge={
          <span className="badge-pill border-[var(--color-risk-medium-border)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium-text)]">
            <span className="size-1.5 rounded-full bg-[var(--color-risk-medium)]" />
            15% Klaim
          </span>
        }
        footer={
          <div className="space-y-3 pt-1">
            <ProgressMetricBar
              dot
              tone="high"
              label="Risiko Tinggi (Skor 70–100)"
              valueText={`${metrics.highRiskCount} Berkas`}
              percent={48}
            />
            <ProgressMetricBar
              dot
              tone="medium"
              label="Perhatian (Skor 40–69)"
              valueText={`${metrics.mediumRiskCount} Berkas`}
              percent={74}
            />
          </div>
        }
      />

      <KpiCard
        title="Progres Klarifikasi RS"
        value={`${clarifyReadyCount} Siap Putus`}
        inlineSubtitle="SLA < 24 jam"
        badge={
          <span className="badge-pill border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)]">
            <span className="size-1.5 rounded-full bg-[var(--color-action-primary)]" />
            {clarifyReadyCount + clarifyWaitingCount} Aktif
          </span>
        }
        footer={
          <div className="space-y-3 pt-1">
            <ProgressMetricBar
              tone="primary"
              label={`${clarifyReadyCount} Berkas Siap Putus`}
              valueText="Diunggah RS"
              percent={64}
              leadingIcon={
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)]">
                  <FileText className="size-3.5" />
                </span>
              }
            />
            <ProgressMetricBar
              tone="medium"
              label={`${clarifyWaitingCount} Menunggu Balasan RS`}
              valueText="SLA < 28 Jam"
              percent={42}
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
