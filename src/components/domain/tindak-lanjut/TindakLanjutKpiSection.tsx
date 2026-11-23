import { KpiCard } from '#/components/shared/KpiCard'
import { formatIdrCompact } from '#/lib/format'
import type { ClusterFollowupSummary } from '#/schemas/clusters.schema'

interface TindakLanjutKpiSectionProps {
  summary: ClusterFollowupSummary
}

export function TindakLanjutKpiSection({
  summary,
}: TindakLanjutKpiSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Menunggu Hasil Lapangan"
        value={`${summary.pendingFieldCount.toLocaleString('id-ID')} Kasus`}
        valueClassName="text-[var(--color-risk-medium)]"
        subtitle="Sidak fisik & cek buku register berjalan"
      />
      <KpiCard
        title="Total Pemulihan Dana (TGR)"
        value={formatIdrCompact(summary.totalTgrIdr)}
        valueClassName="text-[var(--color-risk-low-text)]"
        subtitle={`Dari ${summary.tgrHospitalCount} faskes terbukti penyimpangan`}
      />
      <KpiCard
        title="Eskalasi Evaluasi PKS (Pak Rudi)"
        value={`${summary.pksHospitalCount.toLocaleString('id-ID')} RS FKRTL`}
        valueClassName="text-[var(--color-action-primary)]"
        subtitle="Bahan pertimbangan kerja sama RS"
      />
      <KpiCard
        title="Ditutup / Arsip Wajar"
        value={`${summary.archivedCount.toLocaleString('id-ID')} Kasus`}
        subtitle="Klarifikasi direksi RS diterima sah"
      />
    </section>
  )
}
