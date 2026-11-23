import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { RiskScoreBadge } from '#/components/shared/RiskScoreBadge'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { copyToClipboard, formatIdr } from '#/lib/format'
import { CLAIM_STATUS_META } from '#/lib/status-tokens'
import type { ClaimDetailItem } from '#/schemas/claims.schema'

interface ClaimSummarySectionProps {
  claim: ClaimDetailItem
}

export function ClaimSummarySection({ claim }: ClaimSummarySectionProps) {
  const serviceLabel = claim.serviceType === 'rawat_inap' ? 'Ranap' : 'Rajal'

  const handleCopySep = async () => {
    const ok = await copyToClipboard(claim.noSep)
    if (ok) toast.success(`No. SEP ${claim.noSep} disalin`)
    else toast.error('Gagal menyalin No. SEP')
  }

  return (
    <section className="card-surface grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          PASIEN & NO. SEP
        </p>
        <p className="text-[15px] font-bold text-[var(--color-text-primary)]">
          {claim.patientAlias} ({claim.patientGender}, {claim.patientAge} thn)
        </p>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]">
          <span className="font-mono-code">
            {claim.noSep} · {serviceLabel} {claim.losDays} hr
          </span>
          <button
            type="button"
            onClick={handleCopySep}
            aria-label="Salin Nomor SEP"
            className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
          >
            <Copy className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          RUMAH SAKIT & DPJP
        </p>
        <p className="text-[15px] font-bold text-[var(--color-text-primary)]">
          {claim.hospitalName} (Tipe {claim.facilityType})
        </p>
        <p className="text-[12px] text-[var(--color-text-secondary)]">
          {claim.doctorName} · {claim.doctorSpecialty}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          KLAIM INA-CBG & TAGIHAN
        </p>
        <p className="font-mono-code text-[18px] font-bold text-[var(--color-text-primary)]">
          {formatIdr(claim.tariffIdr)}
        </p>
        <p className="text-[12px] text-[var(--color-text-secondary)]">
          {claim.inacbgCode} · {claim.inacbgDescription}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          STATUS KLAIM SAAT INI
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge meta={CLAIM_STATUS_META[claim.status]} />
          <RiskScoreBadge score={claim.riskScore} />
        </div>
      </div>
    </section>
  )
}
