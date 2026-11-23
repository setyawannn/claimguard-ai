import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  ConfirmActionDialog,
  type ConfirmDialogTone,
} from '#/components/shared/ConfirmActionDialog'
import { CopyDraftButton } from '#/components/shared/CopyDraftButton'
import { ExternalProcessBox } from '#/components/shared/ExternalProcessBox'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Separator } from '#/components/ui/separator'
import { Textarea } from '#/components/ui/textarea'
import { formatIdr } from '#/lib/format'
import { cn } from '#/lib/utils'
import type {
  ClaimDecisionInput,
  ClaimDetailItem,
} from '#/schemas/claims.schema'
import {
  PENDING_CODING_TARGETS,
  REQUIRED_DOCS_BY_TYPOLOGY,
  buildClarificationDraft,
} from './claim-detail.utils'

type TriggerMode = 'klarifikasi' | 'pending_rs' | 'setujui_fp' | 'ditolak'

interface ClaimDecisionPanelSectionProps {
  claim: ClaimDetailItem
  isSubmitting: boolean
  isGeneratingDraft: boolean
  onSubmitDecision: (input: ClaimDecisionInput) => Promise<void>
  onGenerateDraft: (docs: string[]) => Promise<void>
}

function resolveInitialTrigger(status: ClaimDetailItem['status']): TriggerMode {
  if (status === 'pending_rs') return 'pending_rs'
  if (status === 'disetujui' || status === 'false_positive') return 'setujui_fp'
  if (status === 'ditolak') return 'ditolak'
  return 'klarifikasi'
}

export function ClaimDecisionPanelSection({
  claim,
  isSubmitting,
  isGeneratingDraft,
  onSubmitDecision,
  onGenerateDraft,
}: ClaimDecisionPanelSectionProps) {
  const [trigger, setTrigger] = useState<TriggerMode>(() =>
    resolveInitialTrigger(claim.status),
  )
  const [selectedDocs, setSelectedDocs] = useState<string[]>(() => [
    ...REQUIRED_DOCS_BY_TYPOLOGY[claim.fraudTypology],
  ])
  const [codingTargetId, setCodingTargetId] = useState(
    PENDING_CODING_TARGETS[0].id,
  )
  const [approveKind, setApproveKind] = useState<'disetujui' | 'false_positive'>(
    claim.status === 'false_positive' ? 'false_positive' : 'disetujui',
  )
  const [escalateToPkjkn, setEscalateToPkjkn] = useState(
    claim.escalatedToPkjkn,
  )
  const [note, setNote] = useState(claim.decisionNote ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setTrigger(resolveInitialTrigger(claim.status))
    setSelectedDocs([...REQUIRED_DOCS_BY_TYPOLOGY[claim.fraudTypology]])
    setApproveKind(
      claim.status === 'false_positive' ? 'false_positive' : 'disetujui',
    )
    setEscalateToPkjkn(claim.escalatedToPkjkn)
    setNote(claim.decisionNote ?? '')
  }, [claim.id, claim.status, claim.fraudTypology, claim.escalatedToPkjkn, claim.decisionNote])

  const docChecklist = REQUIRED_DOCS_BY_TYPOLOGY[claim.fraudTypology]
  const draftText =
    claim.aiDraftCache && selectedDocs.length === docChecklist.length
      ? claim.aiDraftCache
      : buildClarificationDraft(claim, selectedDocs)

  const selectedTarget =
    PENDING_CODING_TARGETS.find((t) => t.id === codingTargetId) ??
    PENDING_CODING_TARGETS[0]
  const estimatedTariff = selectedTarget.computeTariff(claim)

  const resolveDecision = (): ClaimDecisionInput['decision'] => {
    if (trigger === 'setujui_fp') return approveKind
    return trigger
  }

  const handleOpenConfirm = () => {
    if (note.trim().length < 5) {
      toast.error('Catatan & alasan keputusan minimal 5 karakter.')
      return
    }
    setConfirmOpen(true)
  }

  const confirmConfig: Record<
    TriggerMode,
    {
      tone: ConfirmDialogTone
      title: string
      ctaLabel: string
      confirmLabel: string
      effects: string[]
      summary: string
    }
  > = {
    klarifikasi: {
      tone: 'warning',
      title: 'Kirim Permintaan Klarifikasi ke RS?',
      ctaLabel: 'Tandai Menunggu Konfirmasi RS',
      confirmLabel: 'Ya, Tandai Klarifikasi',
      summary: `SEP ${claim.noSep} · Nilai ditahan ${formatIdr(claim.tariffIdr)}`,
      effects: [
        'Status berkas berubah ke Klarifikasi dan pencairan ditahan.',
        'RS diminta mengunggah dokumen bukti melalui e-Office.',
        'Keputusan tercatat permanen di Audit Log.',
      ],
    },
    pending_rs: {
      tone: 'warning',
      title: 'Kembalikan Berkas untuk Revisi Koding RS?',
      ctaLabel: 'Kembalikan untuk Revisi RS',
      confirmLabel: 'Ya, Kembalikan Pending RS',
      summary: `${selectedTarget.label} · ${formatIdr(claim.tariffIdr)} → ${formatIdr(estimatedTariff)}`,
      effects: [
        'Status berkas berubah ke Pending RS hingga koding direvisi.',
        'Estimasi tarif revisi disimpan sebagai referensi audit.',
        'Keputusan tercatat permanen di Audit Log.',
      ],
    },
    setujui_fp: {
      tone: 'primary',
      title:
        approveKind === 'disetujui'
          ? 'Setujui Klaim untuk Pencairan?'
          : 'Tandai Klaim sebagai False Positive AI?',
      ctaLabel:
        approveKind === 'disetujui'
          ? 'Simpan Keputusan Disetujui'
          : 'Simpan sebagai False Positive',
      confirmLabel:
        approveKind === 'disetujui' ? 'Ya, Setujui Klaim' : 'Ya, Tandai False Positive',
      summary: `SEP ${claim.noSep} · ${formatIdr(claim.tariffIdr)}`,
      effects: [
        `Status akhir berubah menjadi ${approveKind === 'disetujui' ? 'Disetujui' : 'False Positive'}.`,
        'Penghitung penolakan beruntun DPJP direset ke 0.',
        'Keputusan tercatat permanen di Audit Log.',
      ],
    },
    ditolak: {
      tone: 'destructive',
      title: 'Tolak Klaim & Simpan Catatan Audit?',
      ctaLabel: 'Tolak Klaim & Simpan Catatan',
      confirmLabel: 'Ya, Tolak Klaim',
      summary: `Nilai klaim ditolak: ${formatIdr(claim.tariffIdr)}${escalateToPkjkn ? ' · Eskalasi PK-JKN' : ''}`,
      effects: [
        'Status klaim berubah menjadi Ditolak (tidak dicairkan).',
        'Sistem mengevaluasi 3 ambang eskalasi kluster anti-fraud Divre.',
        'Penolakan & alasan tercatat permanen di Audit Log.',
      ],
    },
  }

  const activeConfirm = confirmConfig[trigger]

  const triggerButtons: ReadonlyArray<{
    key: TriggerMode
    label: string
    activeClass: string
  }> = [
    {
      key: 'klarifikasi',
      label: 'Klarifikasi',
      activeClass:
        'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)] font-semibold',
    },
    {
      key: 'pending_rs',
      label: 'Pending RS',
      activeClass:
        'border-[var(--color-risk-medium)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium-text)] font-semibold',
    },
    {
      key: 'setujui_fp',
      label: 'Setujui / FP',
      activeClass:
        'border-[var(--color-risk-low)] bg-[var(--color-risk-low-bg)] text-[var(--color-risk-low-text)] font-semibold',
    },
    {
      key: 'ditolak',
      label: 'Ditolak',
      activeClass:
        'border-[var(--color-risk-high)] bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high-text)] font-semibold',
    },
  ]

  return (
    <aside className="card-surface space-y-4 p-5">
      <div className="space-y-1">
        <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">
          Keputusan Verifikator
        </h2>
        <p className="text-[12px] text-[var(--color-text-secondary)]">
          Pilih status untuk memicu formulir & catatan keputusan.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {triggerButtons.map((btn) => {
          const active = trigger === btn.key
          return (
            <button
              key={btn.key}
              type="button"
              onClick={() => setTrigger(btn.key)}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-[13px] transition-colors',
                active
                  ? btn.activeClass
                  : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-canvas)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {btn.label}
            </button>
          )
        })}
      </div>

      <Separator />

      {trigger === 'klarifikasi' && (
        <div className="space-y-3.5">
          <div className="space-y-2">
            <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
              BUKTI YANG DIBUTUHKAN DARI RS
            </p>
            <div className="space-y-2">
              {docChecklist.map((doc) => {
                const checked = selectedDocs.includes(doc)
                return (
                  <label
                    key={doc}
                    className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[var(--color-text-primary)]"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        setSelectedDocs((prev) =>
                          v === true
                            ? [...prev, doc]
                            : prev.filter((item) => item !== doc),
                        )
                      }
                    />
                    <span>{doc}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3.5">
            <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
              DRAFT PESAN KLARIFIKASI
            </p>
            <p className="whitespace-pre-line text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
              {draftText}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <CopyDraftButton text={draftText} label="Salin Draf" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isGeneratingDraft}
                onClick={() => onGenerateDraft(selectedDocs)}
              >
                {isGeneratingDraft ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-3.5" aria-hidden="true" />
                )}
                <span>
                  {isGeneratingDraft ? 'Menyusun Draf...' : 'Perbarui Draf AI'}
                </span>
              </Button>
            </div>
          </div>

          <ExternalProcessBox title="KORESPONDENSI RESMI E-OFFICE">
            Pengiriman surat dilakukan manual melalui portal e-Office BPJS
            Kesehatan memakai draf di atas.
          </ExternalProcessBox>
        </div>
      )}

      {trigger === 'pending_rs' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
              TARGET KOREKSI KODING INA-CBG
            </Label>
            <Select value={codingTargetId} onValueChange={setCodingTargetId}>
              <SelectTrigger className="w-full border-[var(--color-border-default)] bg-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PENDING_CODING_TARGETS.map((target) => (
                  <SelectItem key={target.id} value={target.id}>
                    {target.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-[12px]">
            <span className="text-[var(--color-text-secondary)]">
              Estimasi Perubahan Tarif
            </span>
            <span className="font-mono-code font-bold text-[var(--color-text-primary)]">
              {formatIdr(claim.tariffIdr)} → {formatIdr(estimatedTariff)}
            </span>
          </div>
        </div>
      )}

      {trigger === 'setujui_fp' && (
        <div className="space-y-2">
          <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
            KATEGORI PERSETUJUAN KLAIM
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: 'disetujui', label: 'Disetujui (Valid)' },
                { key: 'false_positive', label: 'False Positive (AI)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setApproveKind(opt.key)}
                className={cn(
                  'rounded-lg border px-2.5 py-2 text-[12px] transition-colors',
                  approveKind === opt.key
                    ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]'
                    : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {trigger === 'ditolak' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] px-3.5 py-2.5 text-[12px]">
            <span className="font-medium text-[var(--color-risk-high-text)]">
              Nilai Klaim Ditolak
            </span>
            <span className="font-mono-code font-bold text-[var(--color-risk-high-text)]">
              {formatIdr(claim.tariffIdr)}
            </span>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-[var(--color-text-primary)]">
            <Checkbox
              checked={escalateToPkjkn}
              onCheckedChange={(v) => setEscalateToPkjkn(v === true)}
            />
            <span>Teruskan ke Audit PK-JKN</span>
          </label>
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="decision-reason-note"
          className="gap-1 text-caption-tag uppercase text-[var(--color-text-secondary)]"
        >
          <span>CATATAN & ALASAN KEPUTUSAN</span>
          <span className="text-[var(--color-risk-high)]" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id="decision-reason-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tuliskan dasar klinis atau administratif keputusan verifikator..."
          className="resize-none border-[var(--color-border-default)] bg-white text-[13px]"
        />
      </div>

      <Button
        type="button"
        disabled={isSubmitting}
        onClick={handleOpenConfirm}
        className={cn(
          'h-10 w-full font-semibold text-white',
          trigger === 'ditolak'
            ? 'bg-[var(--color-risk-high)] hover:bg-[#b91c1c]'
            : trigger === 'setujui_fp'
              ? 'bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)]'
              : 'bg-[var(--color-risk-medium)] hover:bg-[#b45309]',
        )}
      >
        {activeConfirm.ctaLabel}
      </Button>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone={activeConfirm.tone}
        title={activeConfirm.title}
        summary={activeConfirm.summary}
        effects={activeConfirm.effects}
        confirmLabel={activeConfirm.confirmLabel}
        isPending={isSubmitting}
        onConfirm={async () => {
          await onSubmitDecision({
            claimId: claim.id,
            decision: resolveDecision(),
            note: note.trim(),
            revisedTariffIdr:
              trigger === 'pending_rs' ? estimatedTariff : undefined,
            escalateToPkjkn:
              trigger === 'ditolak' ? escalateToPkjkn : undefined,
          })
          setConfirmOpen(false)
        }}
      />
    </aside>
  )
}
