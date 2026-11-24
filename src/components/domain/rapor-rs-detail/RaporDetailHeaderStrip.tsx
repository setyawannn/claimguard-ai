import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getGradeToneMeta } from '#/components/domain/rapor-rs/rapor-rs.utils'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { copyToClipboard, formatDateId, formatIdr, formatPercent } from '#/lib/format'
import type {
  HospitalDetailItem,
  HospitalDetailNavigation,
} from '#/schemas/hospitals.schema'

interface RaporDetailHeaderStripProps {
  hospital: HospitalDetailItem
  navigation: HospitalDetailNavigation
}

export function RaporDetailHeaderStrip({
  hospital,
  navigation,
}: RaporDetailHeaderStripProps) {
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(hospital.code)
    if (!ok) {
      toast.error('Gagal menyalin kode FKRTL')
      return
    }
    setCopiedCode(true)
    toast.success(`Kode FKRTL ${hospital.code} disalin`)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--color-text-primary)]">
            Rapor Kepatuhan {hospital.name}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-text-secondary)]">
            <Link
              to="/rapor-rs"
              className="font-medium text-[var(--color-action-primary)] hover:underline"
            >
              Rapor Kepatuhan RS
            </Link>{' '}
            / {hospital.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            RS {navigation.index} dari {navigation.total} FKRTL Mitra
          </span>

          {navigation.prevId ? (
            <Button asChild variant="outlinePill" size="sm" className="h-9 px-3.5 text-[12px]">
              <Link
                to="/rapor-rs/$hospitalId"
                params={{ hospitalId: navigation.prevId }}
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                <span>Sebelumnya</span>
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outlinePill"
              size="sm"
              disabled
              className="h-9 px-3.5 text-[12px]"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Sebelumnya</span>
            </Button>
          )}

          {navigation.nextId ? (
            <Button asChild variant="outlinePill" size="sm" className="h-9 px-3.5 text-[12px]">
              <Link
                to="/rapor-rs/$hospitalId"
                params={{ hospitalId: navigation.nextId }}
              >
                <span>{navigation.nextName ?? 'RS Berikutnya'}</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outlinePill"
              size="sm"
              disabled
              className="h-9 px-3.5 text-[12px]"
            >
              <span>Berikutnya</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className="card-surface grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 space-y-1">
          <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
            PROFIL FKRTL & DIREKSI RS
          </p>
          <p className="truncate text-[14px] font-bold text-[var(--color-text-primary)]">
            {hospital.name} (Tipe {hospital.facilityType})
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]">
            <span className="truncate">
              {hospital.code} · {hospital.bedCapacity} TT · {hospital.directorName}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Salin kode FKRTL"
              className="shrink-0 rounded p-0.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
            >
              {copiedCode ? (
                <Check className="size-3.5 text-[var(--color-risk-low)]" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
            MASA KONTRAK PKS & VOLUME
          </p>
          <p className="text-[14px] font-bold text-[var(--color-text-primary)]">
            Berakhir {formatDateId(hospital.pksExpiresAt)}
          </p>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            Rata-rata {hospital.monthlyClaimAvg.toLocaleString('id-ID')} SEP/bln ·{' '}
            {formatPercent(hospital.pilarFastTrackPct)} Fast-Track
          </p>
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
            TEMUAN AUDIT WILAYAH & TGR
          </p>
          <p className="font-mono-code text-[14px] font-bold text-[var(--color-text-primary)]">
            {hospital.tgrBurdenIdr > 0
              ? `TGR ${formatIdr(hospital.tgrBurdenIdr)}`
              : 'Rp 0 Beban TGR'}
          </p>
          <p className="truncate text-[12px] text-[var(--color-text-secondary)]">
            {hospital.cluster
              ? `Kluster ${hospital.cluster.clusterCode} · ${hospital.cluster.escalatedClaimCount} SEP tereskalasi`
              : hospital.dominantTypology}
          </p>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 xl:items-end">
          <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
            SKOR KEPATUHAN Q3 2026
          </p>
          <StatusBadge
            meta={getGradeToneMeta(
              hospital.complianceScore,
              hospital.complianceGrade,
            )}
          />
        </div>
      </div>
    </div>
  )
}
