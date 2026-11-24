import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ExternalLink, Lock, LockOpen } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmActionDialog } from '#/components/shared/ConfirmActionDialog'
import type { ConfirmDialogTone } from '#/components/shared/ConfirmActionDialog'
import { EmptyState } from '#/components/shared/EmptyState'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { formatDateId } from '#/lib/format'
import { PKS_STATUS_META } from '#/lib/status-tokens'
import { cn } from '#/lib/utils'
import type {
  PksDecisionRowItem,
  PksLockInput,
  PksMeetingChecklist,
} from '#/schemas/hospitals.schema'
import { FINAL_POLICY_OPTIONS } from './kebijakan.utils'
import type { FinalPolicyOption } from './kebijakan.utils'

interface KebijakanDecisionPanelProps {
  item: PksDecisionRowItem | null
  isPending: boolean
  onLockDecision: (input: PksLockInput) => Promise<void>
}

function defaultPolicyForItem(
  item: PksDecisionRowItem,
): FinalPolicyOption['value'] {
  const matched = FINAL_POLICY_OPTIONS.find(
    (opt) => opt.value === item.finalPolicy,
  )
  if (matched) return matched.value
  if (item.recommendedPolicy === 'perpanjang') return 'Perpanjang Penuh'
  if (item.recommendedPolicy === 'teguran_sp1') return 'Teguran Keras SP-2'
  return 'PKS Bersyarat 6 Bln'
}

const OPTION_ACTIVE_STYLE: Record<FinalPolicyOption['tone'], string> = {
  danger:
    'border-[var(--color-risk-high)] bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high-text)] ring-1 ring-[var(--color-risk-high)]/25',
  warning:
    'border-[var(--color-risk-medium)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium-text)] ring-1 ring-[var(--color-risk-medium)]/25',
  success:
    'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)] ring-1 ring-[var(--color-action-primary)]/25',
  neutral:
    'border-[var(--color-text-primary)] bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]',
}

export function KebijakanDecisionPanel({
  item,
  isPending,
  onLockDecision,
}: KebijakanDecisionPanelProps) {
  const [checklist, setChecklist] = useState<PksMeetingChecklist>({
    baSigned: false,
    tgrCommitmentReceived: false,
    eofficeRecorded: false,
  })
  const [selectedPolicy, setSelectedPolicy] =
    useState<FinalPolicyOption['value']>('PKS Bersyarat 6 Bln')
  const [eofficeRef, setEofficeRef] = useState('')
  const [executiveNote, setExecutiveNote] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (!item) return
    setChecklist({
      baSigned: item.meetingChecklist.baSigned,
      tgrCommitmentReceived: item.meetingChecklist.tgrCommitmentReceived,
      eofficeRecorded: item.meetingChecklist.eofficeRecorded,
    })
    setSelectedPolicy(defaultPolicyForItem(item))
    setEofficeRef(item.eofficeRefNumber ?? '')
    setExecutiveNote(item.executiveNote ?? '')
    setDialogOpen(false)
  }, [item])

  if (!item) {
    return (
      <section className="card-surface p-5">
        <EmptyState
          title="Pilih FKRTL Mitra"
          description="Pilih salah satu rumah sakit di tabel sebelah kiri untuk mencatat hasil rapat evaluasi & mengunci keputusan kontrak PKS."
        />
      </section>
    )
  }

  const allChecklistVerified =
    checklist.baSigned &&
    checklist.tgrCommitmentReceived &&
    checklist.eofficeRecorded

  const dialogTone: ConfirmDialogTone =
    selectedPolicy === 'Putus Layanan' ||
    selectedPolicy === 'Teguran Keras SP-2'
      ? 'destructive'
      : selectedPolicy === 'PKS Bersyarat 6 Bln'
        ? 'warning'
        : 'primary'

  const handleOpenConfirm = () => {
    if (!allChecklistVerified) {
      toast.error(
        'Centang seluruh 3 bukti verifikasi dokumen rapat & e-Office terlebih dahulu.',
      )
      return
    }
    if (eofficeRef.trim().length < 4) {
      toast.error('Nomor surat e-Office BPJS wajib diisi minimal 4 karakter.')
      return
    }
    if (executiveNote.trim().length < 5) {
      toast.error('Catatan keputusan rapat wajib diisi minimal 5 karakter.')
      return
    }
    setDialogOpen(true)
  }

  const handleConfirmLock = async () => {
    await onLockDecision({
      decisionId: item.decisionId,
      finalPolicy: selectedPolicy,
      eofficeRefNumber: eofficeRef.trim(),
      meetingChecklist: checklist,
      executiveNote: executiveNote.trim(),
    })
    setDialogOpen(false)
  }

  return (
    <aside className="card-surface flex flex-col gap-4 p-5 xl:sticky xl:top-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold leading-snug text-[var(--color-text-primary)]">
            Catat Hasil Rapat Evaluasi PKS
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-secondary)]">
            {item.hospitalName} · Skor {item.complianceScore} (Grade{' '}
            {item.complianceGrade})
          </p>
        </div>
        <StatusBadge meta={PKS_STATUS_META[item.pksStatus]} />
      </div>

      <div className="flex items-center justify-between gap-2 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3 py-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
          {item.isLocked ? (
            <>
              <Lock
                className="size-3.5 text-[var(--color-risk-low)]"
                aria-hidden="true"
              />
              <span>
                Terkunci{' '}
                {item.lockedAt ? `(${formatDateId(item.lockedAt.slice(0, 10))})` : 'Final'}
              </span>
            </>
          ) : (
            <>
              <LockOpen
                className="size-3.5 text-[var(--color-risk-medium)]"
                aria-hidden="true"
              />
              <span>Menunggu Keputusan Final</span>
            </>
          )}
        </span>
        <Link
          to="/rapor-rs/$hospitalId"
          params={{ hospitalId: item.hospitalId }}
          className="inline-flex items-center gap-1 font-semibold text-[var(--color-action-primary)] hover:underline"
        >
          <span>Lihat Rapor</span>
          <ExternalLink className="size-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="rounded-[12px] border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)]/55 p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--color-action-primary)]">
          Rekomendasi &amp; Bahan Rapat
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-primary)]">
          {item.executiveNote ??
            'Siapkan Berita Acara evaluasi kepatuhan & surat komitmen perbaikan FKRTL.'}
        </p>
        {item.addendumRequirements.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[11.5px] text-[var(--color-text-secondary)]">
            {item.addendumRequirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]">
          Dokumen Rapat &amp; e-Office Terverifikasi{' '}
          <span className="text-[var(--color-risk-high)]">*</span>
        </p>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-[12.5px] text-[var(--color-text-primary)]">
          <Checkbox
            checked={checklist.baSigned}
            onCheckedChange={(checked) =>
              setChecklist((prev) => ({
                ...prev,
                baSigned: checked === true,
              }))
            }
            className="mt-0.5"
          />
          <span>Berita Acara Rapat Evaluasi PKS Ditandatangani Direksi RS</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-[12.5px] text-[var(--color-text-primary)]">
          <Checkbox
            checked={checklist.tgrCommitmentReceived}
            onCheckedChange={(checked) =>
              setChecklist((prev) => ({
                ...prev,
                tgrCommitmentReceived: checked === true,
              }))
            }
            className="mt-0.5"
          />
          <span>Surat Komitmen Pelunasan TGR Diterima Cabang</span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-3 py-2 text-[12.5px] text-[var(--color-text-primary)]">
          <Checkbox
            checked={checklist.eofficeRecorded}
            onCheckedChange={(checked) =>
              setChecklist((prev) => ({
                ...prev,
                eofficeRecorded: checked === true,
              }))
            }
            className="mt-0.5"
          />
          <span>Nomor Surat Keputusan / Addendum Dicatat di e-Office BPJS</span>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]">
          Tetapkan Keputusan Akhir Kontrak PKS 2027
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FINAL_POLICY_OPTIONS.map((option) => {
            const isActive = selectedPolicy === option.value
            return (
              <button
                key={option.value}
                type="button"
                title={option.hint}
                onClick={() => setSelectedPolicy(option.value)}
                className={cn(
                  'rounded-[10px] border px-3 py-2.5 text-center text-[12.5px] font-semibold transition-all',
                  isActive
                    ? OPTION_ACTIVE_STYLE[option.tone]
                    : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="eoffice-ref-input"
          className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]"
        >
          No. Surat e-Office{' '}
          <span className="text-[var(--color-risk-high)]">*</span>
        </Label>
        <Input
          id="eoffice-ref-input"
          value={eofficeRef}
          onChange={(e) => setEofficeRef(e.target.value)}
          placeholder="Contoh: BA-PKS/412/KC-MLG/X/2026"
          className="h-10 rounded-[10px] font-mono-code text-[12.5px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="executive-decision-note"
          className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--color-text-secondary)]"
        >
          Catatan Keputusan Rapat{' '}
          <span className="text-[var(--color-risk-high)]">*</span>
        </Label>
        <Textarea
          id="executive-decision-note"
          rows={3}
          value={executiveNote}
          onChange={(e) => setExecutiveNote(e.target.value)}
          placeholder="Ringkasan kesepakatan direksi RS, jadwal pelunasan TGR, & audit bulanan..."
          className="resize-none rounded-[10px] text-[12.5px]"
        />
      </div>

      <Button
        type="button"
        disabled={isPending}
        onClick={handleOpenConfirm}
        className="h-11 w-full rounded-full font-semibold"
      >
        <span>
          {item.isLocked
            ? 'Perbarui & Kunci Ulang Log PKS'
            : 'Simpan Keputusan Final PKS & Kunci Log'}
        </span>
      </Button>

      <ConfirmActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tone={dialogTone}
        title={
          selectedPolicy === 'Putus Layanan'
            ? `Konfirmasi Putus Layanan — ${item.hospitalName}`
            : `Kunci Keputusan PKS — ${item.hospitalName}`
        }
        summary={`Menetapkan keputusan akhir "${selectedPolicy}" dengan nomor e-Office ${eofficeRef.trim()}.`}
        effects={[
          `Status kontrak PKS ${item.hospitalName} diperbarui permanen pada database cabang.`,
          'Ketiga bukti verifikasi rapat direksi & komitmen TGR dikunci pada tabel keputusan PKS.',
          'Entri LOCK_PKS_DECISION dicatat sebagai audit trail tata kelola yang tidak dapat dihapus.',
        ]}
        confirmLabel="Kunci Keputusan Final"
        requireNote={false}
        isPending={isPending}
        onConfirm={handleConfirmLock}
      />
    </aside>
  )
}
