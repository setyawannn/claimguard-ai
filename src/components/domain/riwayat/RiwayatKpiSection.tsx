import { KpiCard } from '#/components/shared/KpiCard'
import { formatIdrCompact } from '#/lib/format'
import type { ClaimsHistorySummary } from '#/schemas/claims.schema'

interface RiwayatKpiSectionProps {
  summary: ClaimsHistorySummary
}

export function RiwayatKpiSection({ summary }: RiwayatKpiSectionProps) {
  const fpAndPendingTotal = summary.falsePositiveCount + summary.pendingRsCount

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Perlu Status Akhir (Klarifikasi)"
        value={`${summary.needFinalCount.toLocaleString('id-ID')} Berkas`}
        valueClassName="text-[var(--color-risk-medium)]"
        subtitle="Menunggu penetapan status akhir & catatan"
      />
      <KpiCard
        title="Total Klaim Disetujui"
        value={`${summary.approvedCount.toLocaleString('id-ID')} Berkas`}
        valueClassName="text-[var(--color-risk-low-text)]"
        subtitle={`${formatIdrCompact(summary.approvedAmountIdr)} siap masuk BAHV pencairan`}
      />
      <KpiCard
        title="False Positive & Pending RS"
        value={`${fpAndPendingTotal.toLocaleString('id-ID')} Berkas`}
        valueClassName="text-[var(--color-action-primary)]"
        subtitle={`${summary.falsePositiveCount} koreksi AI (FP) · ${summary.pendingRsCount} revisi koding RS`}
      />
      <KpiCard
        title="Klaim Ditolak"
        value={`${summary.rejectedCount.toLocaleString('id-ID')} Berkas`}
        valueClassName="text-[var(--color-risk-high)]"
        subtitle={`${formatIdrCompact(summary.rejectedSavingsIdr)} efisiensi biaya terselamatkan`}
      />
    </section>
  )
}
