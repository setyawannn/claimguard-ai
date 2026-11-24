import { KpiCard } from '#/components/shared/KpiCard'
import { formatIdrCompact } from '#/lib/format'
import type { PksDecisionsSummary } from '#/schemas/hospitals.schema'

interface KebijakanKpiRowProps {
  summary: PksDecisionsSummary
}

export function KebijakanKpiRow({ summary }: KebijakanKpiRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Menunggu Rapat Evaluasi PKS"
        value={`${summary.waitingMeetingCount} RS FKRTL`}
        valueClassName="text-[var(--color-risk-medium-text)]"
        subtitle="Bahan rapat & draf e-Office siap dibawa"
      />
      <KpiCard
        title="PKS Bersyarat & Teguran (SP-1)"
        value={`${summary.conditionalAndSp1Count} RS FKRTL`}
        valueClassName="text-[var(--color-risk-low-text)]"
        subtitle="Wajib lunasi TGR & audit BOR 30 Nov 2026"
      />
      <KpiCard
        title="Realisasi Komitmen TGR Cabang"
        value={formatIdrCompact(summary.totalTgrCommitmentIdr)}
        valueClassName="text-[var(--color-action-primary)]"
        subtitle="Disepakati dalam BAP & Rapat Kemitraan"
      />
      <KpiCard
        title="Kontrak PKS 2027 Diperpanjang"
        value={`${summary.extendedPatuhCount} RS Patuh`}
        subtitle="Skor ≥ 85 · Perpanjangan reguler 1 tahun"
      />
    </div>
  )
}
