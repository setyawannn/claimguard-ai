import { SectionCard } from '#/components/shared/SectionCard'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { formatIdrCompact, formatPercent } from '#/lib/format'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import { cn } from '#/lib/utils'
import type { HospitalDetailItem } from '#/schemas/hospitals.schema'

interface RaporDetailPilarSectionProps {
  hospital: HospitalDetailItem
}

export function RaporDetailPilarSection({
  hospital,
}: RaporDetailPilarSectionProps) {
  const highBor = Math.max(hospital.borTotalPct, hospital.borCardioVipPct)
  const idealBor = 78
  const isOverCapacity = highBor >= 95

  return (
    <div className="space-y-5">
      <SectionCard
        title="Eskalasi Pengawas Wilayah & Berkas Rapat PKS"
        action={<StatusBadge meta={PKS_STATUS_META[hospital.pksStatus]} />}
      >
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
              HASIL SIDAK WILAYAH
            </p>
            <p className="text-[14px] font-bold text-[var(--color-risk-medium)]">
              {hospital.cluster
                ? `Kluster ${hospital.cluster.clusterCode} · Tindak Lanjut Wilayah`
                : 'Tidak Ada Sidak Khusus'}
            </p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              {hospital.cluster?.auditResultNote ??
                `${hospital.dominantTypology} berada dalam pemantauan berkala cabang.`}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
              POSISI KONTRAK PKS TAHUN 2027
            </p>
            <p className="text-[14px] font-bold text-[var(--color-text-primary)]">
              {hospital.pksDraft?.isLocked
                ? `Final: ${hospital.pksDraft.finalPolicy ?? PKS_STATUS_META[hospital.pksStatus].label}`
                : 'Menunggu Keputusan Kepala Cabang'}
            </p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Standar perpanjangan PKS otomatis: Skor ≥ 80 &amp; pelunasan TGR.
            </p>
          </div>
        </div>
      </SectionCard>

      <section className="card-surface space-y-5 p-6">
        <div className="space-y-2">
          <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">
            Ringkasan Eksekutif Evaluasi Kepatuhan {hospital.name}
          </h2>
          <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
            Skor kepatuhan {hospital.name} tercatat{' '}
            <strong className="font-semibold text-[var(--color-text-primary)]">
              {hospital.complianceScore}/100 (Grade {hospital.complianceGrade})
            </strong>{' '}
            pada Triwulan III 2026 dengan okupansi kasur total{' '}
            {formatPercent(hospital.borTotalPct)} (unit khusus{' '}
            {formatPercent(hospital.borCardioVipPct)} dari {hospital.bedCapacity} TT)
            serta dominasi pola{' '}
            <strong className="font-semibold text-[var(--color-text-primary)]">
              {hospital.dominantTypology}
            </strong>
            {hospital.tgrBurdenIdr > 0
              ? ` dan akumulasi TGR ${formatIdrCompact(hospital.tgrBurdenIdr)}.`
              : '.'}
          </p>
        </div>

        <div className="space-y-4 border-t border-[var(--color-border-default)] pt-4">
          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
            Bedah 4 Pilar Kepatuhan &amp; Temuan Permenkes 16/2019
          </h3>

          <div className="space-y-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)]/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-2.5 rounded-full',
                    hospital.pilarBorScore < 70
                      ? 'bg-[var(--color-risk-high)]'
                      : 'bg-[var(--color-risk-low)]',
                  )}
                />
                <span className="text-[13px] font-bold text-[var(--color-text-primary)]">
                  Pilar 1 · Kewajaran BOR &amp; Kapasitas Kamar (Aplicares)
                </span>
              </div>
              <StatusBadge
                meta={{
                  label: `Skor ${hospital.pilarBorScore}/100`,
                  badgeClass:
                    hospital.pilarBorScore < 70
                      ? 'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high-border)] text-[var(--color-risk-high-text)]'
                      : 'bg-[var(--color-bg-muted)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
                  dotClass:
                    hospital.pilarBorScore < 70
                      ? 'bg-[var(--color-risk-high)]'
                      : 'bg-[var(--color-text-secondary)]',
                }}
              />
            </div>
            <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
              BOR total dilaporkan {formatPercent(hospital.borTotalPct)}, klaim
              unit VIP/Khusus mencapai {formatPercent(hospital.borCardioVipPct)}{' '}
              kapasitas resmi Aplicares ({hospital.bedCapacity} TT).
            </p>
            {hospital.tgrBurdenIdr > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <StatusBadge
                  meta={{
                    label: `TGR ${formatIdrCompact(hospital.tgrBurdenIdr)}`,
                    badgeClass:
                      'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high-border)] text-[var(--color-risk-high-text)]',
                    dotClass: 'bg-[var(--color-risk-high)]',
                  }}
                />
                <span className="text-[12px] font-medium text-[var(--color-risk-high)]">
                  Di bawah ambang perpanjangan PKS otomatis (Skor ≥ 80/100)
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)]/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-2.5 rounded-full',
                    hospital.pilarCodingScore < 70
                      ? 'bg-[var(--color-risk-high)]'
                      : 'bg-[var(--color-action-primary)]',
                  )}
                />
                <span className="text-[13px] font-bold text-[var(--color-text-primary)]">
                  Pilar 2, 3 &amp; 4 · Akurasi Koding, Fast-Track &amp; Respons RS
                </span>
              </div>
              <StatusBadge
                meta={{
                  label: `Skor ${Math.round((hospital.pilarCodingScore + hospital.pilarResponseScore) / 2)}/100`,
                  badgeClass:
                    'bg-[var(--color-bg-muted)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
                  dotClass: 'bg-[var(--color-text-secondary)]',
                }}
              />
            </div>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Koding INA-CBG{' '}
              <strong className="font-semibold text-[var(--color-text-primary)]">
                {hospital.pilarCodingScore}/100
              </strong>{' '}
              · Klaim Fast-Track{' '}
              <strong className="font-semibold text-[var(--color-text-primary)]">
                {formatPercent(hospital.pilarFastTrackPct)} bersih
              </strong>{' '}
              · Respons Klarifikasi{' '}
              <strong className="font-semibold text-[var(--color-text-primary)]">
                {hospital.pilarResponseScore}/100
              </strong>
            </p>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              Pola layanan utama: {hospital.dominantTypology}.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-[var(--color-border-default)] pt-4">
          <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
            Grafik Perbandingan Okupansi Kamar
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-[180px_minmax(0,1fr)_90px] items-center gap-3 text-[12px]">
              <span className="text-[var(--color-text-secondary)]">
                Klaim {hospital.name}
              </span>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-risk-high-bg)]">
                <div
                  className={cn(
                    'h-full rounded-full',
                    isOverCapacity
                      ? 'bg-[var(--color-risk-high)]'
                      : 'bg-[var(--color-action-primary)]',
                  )}
                  style={{ width: `${Math.min(100, Math.round((highBor / 130) * 100))}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-right font-mono-code font-bold',
                  isOverCapacity
                    ? 'text-[var(--color-risk-high)]'
                    : 'text-[var(--color-text-primary)]',
                )}
              >
                {formatPercent(highBor)} {isOverCapacity ? '(Over)' : ''}
              </span>
            </div>

            <div className="grid grid-cols-[180px_minmax(0,1fr)_90px] items-center gap-3 text-[12px]">
              <span className="text-[var(--color-text-secondary)]">
                Standar Ideal BOR (Aplicares)
              </span>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--color-action-primary)]"
                  style={{ width: `${Math.round((idealBor / 130) * 100)}%` }}
                />
              </div>
              <span className="text-right font-mono-code font-semibold text-[var(--color-text-primary)]">
                {idealBor}% (Wajar)
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
