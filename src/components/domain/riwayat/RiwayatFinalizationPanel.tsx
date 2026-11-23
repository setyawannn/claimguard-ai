import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmActionDialog } from '#/components/shared/ConfirmActionDialog'
import type { ConfirmDialogTone } from '#/components/shared/ConfirmActionDialog'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { formatDateId, formatIdr, formatThousandsId } from '#/lib/format'
import { CLAIM_STATUS_META } from '#/lib/status-tokens'
import { cn } from '#/lib/utils'
import type {
  ClaimDecisionInput,
  ClaimHistoryItem,
} from '#/schemas/claims.schema'

type FinalDecisionKind = 'disetujui' | 'false_positive' | 'pending_rs' | 'ditolak'

interface RiwayatFinalizationPanelProps {
  claim: ClaimHistoryItem | null
  isSubmitting: boolean
  onSubmitDecision: (input: ClaimDecisionInput) => Promise<void>
}

const FINAL_OPTIONS: ReadonlyArray<{
  key: FinalDecisionKind
  label: string
  activeClass: string
}> = [
  {
    key: 'disetujui',
    label: 'Disetujui',
    activeClass:
      'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]',
  },
  {
    key: 'false_positive',
    label: 'False Positive',
    activeClass:
      'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]',
  },
  {
    key: 'pending_rs',
    label: 'Pending RS',
    activeClass:
      'border-[var(--color-risk-medium)] bg-[var(--color-risk-medium-bg)] font-semibold text-[var(--color-risk-medium-text)]',
  },
  {
    key: 'ditolak',
    label: 'Ditolak',
    activeClass:
      'border-[var(--color-risk-high)] bg-[var(--color-risk-high-bg)] font-semibold text-[var(--color-risk-high-text)]',
  },
]

function resolveInitialDecision(status: ClaimHistoryItem['status']): FinalDecisionKind {
  if (
    status === 'disetujui' ||
    status === 'false_positive' ||
    status === 'pending_rs' ||
    status === 'ditolak'
  ) {
    return status
  }
  return 'pending_rs'
}

export function RiwayatFinalizationPanel({
  claim,
  isSubmitting,
  onSubmitDecision,
}: RiwayatFinalizationPanelProps) {
  const [hospitalResponded, setHospitalResponded] = useState(true)
  const [selectedDecision, setSelectedDecision] =
    useState<FinalDecisionKind>('pending_rs')
  const [revisedTariffText, setRevisedTariffText] = useState('')
  const [escalateToPkjkn, setEscalateToPkjkn] = useState(false)
  const [note, setNote] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!claim) return
    setHospitalResponded(
      Boolean(
        claim.hospitalRespondedAt ||
          claim.hospitalResponseNote ||
          claim.status === 'balasan_rs',
      ),
    )
    setSelectedDecision(resolveInitialDecision(claim.status))
    setRevisedTariffText(
      formatThousandsId(
        String(claim.revisedTariffIdr ?? Math.round(claim.tariffIdr * 0.65)),
      ),
    )
    setEscalateToPkjkn(claim.escalatedToPkjkn)
    setNote(claim.decisionNote ?? claim.hospitalResponseNote ?? '')
  }, [
    claim?.id,
    claim?.status,
    claim?.hospitalRespondedAt,
    claim?.hospitalResponseNote,
    claim?.revisedTariffIdr,
    claim?.tariffIdr,
    claim?.escalatedToPkjkn,
    claim?.decisionNote,
  ])

  if (!claim) {
    return (
      <aside className="card-surface p-6">
        <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">
          Edit Status Akhir Klarifikasi
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Pilih salah satu berkas pada tabel riwayat di sebelah kiri untuk
          menetapkan atau memperbarui status akhir beserta catatan putusan.
        </p>
      </aside>
    )
  }

  const clarificationDate = formatDateId(
    claim.clarificationRequestedAt ?? claim.admissionDate,
  ).toUpperCase()

  const parsedRevisedTariff = Number(revisedTariffText.replace(/\D/g, ''))
  const validRevisedTariff =
    Number.isFinite(parsedRevisedTariff) && parsedRevisedTariff > 0
      ? parsedRevisedTariff
      : undefined

  const handleRequestConfirm = () => {
    if (note.trim().length < 5) {
      toast.error('Catatan hasil akhir & alasan putusan minimal 5 karakter.')
      return
    }
    setConfirmOpen(true)
  }

  const confirmTone: ConfirmDialogTone =
    selectedDecision === 'ditolak'
      ? 'destructive'
      : selectedDecision === 'pending_rs'
        ? 'warning'
        : 'primary'

  const targetMeta = CLAIM_STATUS_META[selectedDecision]

  return (
    <aside className="card-surface space-y-5 p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold leading-snug text-[var(--color-text-primary)]">
            Edit Status Akhir Klarifikasi
          </h2>
          <p className="mt-1 truncate font-mono-code text-[11px] text-[var(--color-text-secondary)]">
            {claim.noSep} · {claim.hospitalName}
          </p>
        </div>
        <StatusBadge
          meta={CLAIM_STATUS_META[claim.status]}
          className="shrink-0 whitespace-nowrap"
        />
      </div>

      <div className="space-y-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3.5">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          PERMINTAAN KLARIFIKASI AWAL ({clarificationDate})
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--color-text-primary)]">
          {claim.initialClarificationNote ??
            'Diminta konfirmasi bukti indikasi medis dan kelengkapan rekam medis dari rumah sakit.'}
        </p>
        {claim.hospitalResponseNote && (
          <p className="border-t border-[var(--color-border-default)] pt-2 text-[12px] text-[var(--color-text-secondary)]">
            <strong className="font-semibold text-[var(--color-text-primary)]">
              Balasan RS:
            </strong>{' '}
            {claim.hospitalResponseNote}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          RESPON KONFIRMASI RUMAH SAKIT
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setHospitalResponded(true)}
            className={cn(
              'rounded-xl border px-3 py-2 text-[12px] transition-colors',
              hospitalResponded
                ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]'
                : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            Konfirmasi RS Diterima
          </button>
          <button
            type="button"
            onClick={() => setHospitalResponded(false)}
            className={cn(
              'rounded-xl border px-3 py-2 text-[12px] transition-colors',
              !hospitalResponded
                ? 'border-[var(--color-risk-medium)] bg-[var(--color-risk-medium-bg)] font-semibold text-[var(--color-risk-medium-text)]'
                : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            SLA Habis Tanpa Respon
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          TETAPKAN STATUS AKHIR KLAIM
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FINAL_OPTIONS.map((opt) => {
            const active = selectedDecision === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedDecision(opt.key)}
                className={cn(
                  'rounded-xl border px-3 py-2 text-[12px] transition-colors',
                  active
                    ? opt.activeClass
                    : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDecision === 'pending_rs' && (
        <div className="space-y-1.5">
          <Label
            htmlFor="riwayat-revised-tariff"
            className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
          >
            Estimasi Tarif Setelah Revisi
          </Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-code text-[12px] font-semibold text-[var(--color-text-secondary)]"
              aria-hidden="true"
            >
              Rp
            </span>
            <Input
              id="riwayat-revised-tariff"
              inputMode="numeric"
              value={revisedTariffText}
              onChange={(e) =>
                setRevisedTariffText(formatThousandsId(e.target.value))
              }
              placeholder="8.400.000"
              className="border-[var(--color-border-default)] bg-white pl-10 font-mono-code text-[12px]"
            />
          </div>
        </div>
      )}

      {selectedDecision === 'ditolak' && (
        <div className="space-y-2.5 rounded-xl border border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-medium text-[var(--color-risk-high-text)]">
              Efisiensi Klaim Ditolak
            </span>
            <span className="font-mono-code font-bold text-[var(--color-risk-high-text)]">
              {formatIdr(claim.tariffIdr)}
            </span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-[var(--color-risk-high-text)]">
            <Checkbox
              checked={escalateToPkjkn}
              onCheckedChange={(v) => setEscalateToPkjkn(v === true)}
            />
            <span>Eskalasi kluster ke Audit PK-JKN (Divre Jatim)</span>
          </label>
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="riwayat-final-note"
          className="gap-1 text-caption-tag uppercase text-[var(--color-text-secondary)]"
        >
          <span>CATATAN & ALASAN PUTUSAN</span>
          <span className="text-[var(--color-risk-high)]" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id="riwayat-final-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tuliskan hasil verifikasi dokumen bukti dan dasar status akhir..."
          className="resize-none rounded-xl border-[var(--color-border-default)] bg-white text-[13px] leading-relaxed"
        />
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={handleRequestConfirm}
          className="h-10 w-full rounded-full bg-[var(--color-action-primary)] font-semibold text-white hover:bg-[var(--color-action-primary-hover)]"
        >
          Simpan Status Akhir & Catatan
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-action-primary)]"
        >
          <Link to="/antrean/$claimId" params={{ claimId: claim.id }}>
            <span>Buka Detail Pemeriksaan Lengkap</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone={confirmTone}
        title={`Simpan Status '${targetMeta.label}'?`}
        summary={`SEP ${claim.noSep} · ${claim.patientAlias} · ${formatIdr(claim.tariffIdr)}`}
        effects={[
          `Status klaim diperbarui menjadi ${targetMeta.label}.`,
          'Perubahan status akhir dan catatan putusan dicatat permanen ke Audit Log.',
          selectedDecision === 'ditolak'
            ? 'Sistem mengevaluasi ambang batas eskalasi 30 hari untuk kluster Divre Jatim.'
            : 'Berkas masuk ke rekapitulasi BAHV sesuai status terbarunya.',
        ]}
        confirmLabel={`Ya, Simpan ${targetMeta.label}`}
        isPending={isSubmitting}
        onConfirm={async () => {
          await onSubmitDecision({
            claimId: claim.id,
            decision: selectedDecision,
            note: note.trim(),
            hospitalResponded,
            revisedTariffIdr:
              selectedDecision === 'pending_rs' ? validRevisedTariff : undefined,
            escalateToPkjkn:
              selectedDecision === 'ditolak' ? escalateToPkjkn : undefined,
          })
          setConfirmOpen(false)
        }}
      />
    </aside>
  )
}
