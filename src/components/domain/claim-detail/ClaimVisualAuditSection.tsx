import { AlertTriangle, Clock, Database, Loader2, Sparkles } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { Skeleton } from '#/components/ui/skeleton'
import { parseAiNarrativeCache } from '#/lib/ai-narrative'
import { formatDateId, formatIdr } from '#/lib/format'
import { CLAIM_STATUS_META, type ClaimStatus } from '#/lib/status-tokens'
import type {
  ClaimAuditEntry,
  ClaimDetailItem,
} from '#/schemas/claims.schema'
import { buildDefaultStructuredNarrative } from './claim-detail.utils'

interface ClaimVisualAuditSectionProps {
  claim: ClaimDetailItem
  auditLogs: readonly ClaimAuditEntry[]
  isGeneratingNarrative: boolean
  onGenerateNarrative: () => void
}

export function ClaimVisualAuditSection({
  claim,
  auditLogs,
  isGeneratingNarrative,
  onGenerateNarrative,
}: ClaimVisualAuditSectionProps) {
  const cachedNarrative = parseAiNarrativeCache(claim.aiNarrativeCache)
  const narrative = cachedNarrative ?? buildDefaultStructuredNarrative(claim)
  const isCached = Boolean(cachedNarrative)

  const maxBarTariff = Math.max(claim.tariffIdr, claim.peerAvgTariffIdr, 1)
  const rsBarPct = Math.round((claim.tariffIdr / maxBarTariff) * 100)
  const peerBarPct = Math.round((claim.peerAvgTariffIdr / maxBarTariff) * 100)
  const deviationPct =
    claim.peerAvgTariffIdr > 0
      ? Math.round(
          ((claim.tariffIdr - claim.peerAvgTariffIdr) /
            claim.peerAvgTariffIdr) *
            100,
        )
      : 0

  return (
    <section className="card-surface space-y-6 p-6">
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">
              Analisis & Ringkasan Temuan AI
            </h2>
            {isCached && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-risk-low-border)] bg-[var(--color-risk-low-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-risk-low-text)]">
                <Database className="size-3" aria-hidden="true" />
                Tersimpan di DB
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outlinePill"
            size="sm"
            disabled={isGeneratingNarrative}
            onClick={onGenerateNarrative}
            className="h-8 gap-1.5 px-3 text-[12px]"
          >
            {isGeneratingNarrative ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles
                className="size-3.5 text-[var(--color-action-primary)]"
                aria-hidden="true"
              />
            )}
            <span>
              {isGeneratingNarrative
                ? 'Menyusun Analisis...'
                : 'Perbarui Analisis AI'}
            </span>
          </Button>
        </div>

        {isGeneratingNarrative && !isCached ? (
          <div className="space-y-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4">
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">
              Menyusun analisis klinis terstruktur untuk berkas ini...
            </p>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4">
            <div className="space-y-1">
              <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
                RINGKASAN KASUS
              </p>
              <p className="text-[13px] leading-relaxed text-[var(--color-text-primary)]">
                {narrative.ringkasanKasus}
              </p>
            </div>

            {narrative.analisisAnomali && (
              <div className="space-y-1">
                <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
                  ANALISIS ANOMALI & DEVIASI TARIF
                </p>
                <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {narrative.analisisAnomali}
                </p>
              </div>
            )}

            {narrative.fokusPemeriksaan.length > 0 && (
              <div className="space-y-1">
                <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
                  FOKUS PEMERIKSAAN VERIFIKATOR
                </p>
                <ol className="list-decimal space-y-1 pl-4 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {narrative.fokusPemeriksaan.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">
          Garis Waktu Rekam Medis
        </h2>

        <div className="space-y-2.5">
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3">
            <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[var(--color-action-primary)]" />
            <div className="space-y-0.5 text-[12px]">
              <p className="font-semibold text-[var(--color-text-primary)]">
                Rujukan / Episode Pra-Klaim · {claim.referringFacility}
              </p>
              <p className="text-[var(--color-text-secondary)]">
                Diagnosa awal {claim.icd10Primary} · NIK tersamar{' '}
                <span className="font-mono-code">{claim.patientNikMasked}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-risk-high-text)]">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            <span>{claim.signalSummary}</span>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3">
            <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[var(--color-risk-high)]" />
            <div className="space-y-0.5 text-[12px]">
              <p className="font-semibold text-[var(--color-text-primary)]">
                Tagihan Episode Aktif · {claim.hospitalName} (Kelas{' '}
                {claim.careClass})
              </p>
              <p className="text-[var(--color-text-secondary)]">
                {formatDateId(claim.admissionDate)} –{' '}
                {formatDateId(claim.dischargeDate)} ({claim.losDays} hari) ·{' '}
                {claim.inacbgDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">
            Grafik Perbandingan Tarif & Kepatuhan Klinis
          </h2>
          {deviationPct > 0 && (
            <span className="rounded-full border border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] px-2.5 py-0.5 font-mono-code text-[11px] font-semibold text-[var(--color-risk-high-text)]">
              +{deviationPct}% vs Peer Group
            </span>
          )}
        </div>

        <div className="space-y-2.5 text-[12px]">
          <div className="space-y-1">
            <div className="flex justify-between font-medium">
              <span className="text-[var(--color-text-secondary)]">
                Tarif Diajukan RS
              </span>
              <span className="font-mono-code font-semibold text-[var(--color-text-primary)]">
                {formatIdr(claim.tariffIdr)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
              <div
                className="h-full rounded-full bg-[var(--color-action-primary)]"
                style={{ width: `${rsBarPct}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-medium">
              <span className="text-[var(--color-text-secondary)]">
                Rata-Rata Peer Group Tipe {claim.facilityType}
              </span>
              <span className="font-mono-code font-semibold text-[var(--color-text-primary)]">
                {formatIdr(claim.peerAvgTariffIdr)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
              <div
                className="h-full rounded-full bg-[var(--color-risk-low)]"
                style={{ width: `${peerBarPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-2.5">
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Medis (40%)
            </p>
            <p className="font-mono-code text-[15px] font-bold text-[var(--color-text-primary)]">
              {claim.scoreMedical}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-2.5">
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Statistik (35%)
            </p>
            <p className="font-mono-code text-[15px] font-bold text-[var(--color-text-primary)]">
              {claim.scoreStatistical}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-2.5">
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Jaringan (25%)
            </p>
            <p className="font-mono-code text-[15px] font-bold text-[var(--color-text-primary)]">
              {claim.scoreNetwork}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2.5">
        <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">
          Rekam Jejak Audit Berkas
        </h2>
        {auditLogs.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            Belum ada catatan keputusan pada berkas ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {auditLogs.map((log) => {
              const toLabel =
                log.toStatus && log.toStatus in CLAIM_STATUS_META
                  ? CLAIM_STATUS_META[log.toStatus as ClaimStatus].label
                  : log.action
              return (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-[12px]"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {log.actorName} · {toLabel}
                    </p>
                    {log.note && (
                      <p className="text-[var(--color-text-secondary)]">
                        {log.note}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 font-mono-code text-[11px] text-[var(--color-text-secondary)]">
                    <Clock className="size-3" aria-hidden="true" />
                    {formatDateId(log.createdAtIso)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
