import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmActionDialog } from '#/components/shared/ConfirmActionDialog'
import type { ConfirmDialogTone } from '#/components/shared/ConfirmActionDialog'
import { CopyDraftButton } from '#/components/shared/CopyDraftButton'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { formatDateId } from '#/lib/format'
import { cn } from '#/lib/utils'
import type {
  HospitalDetailItem,
  PksRecommendationInput,
} from '#/schemas/hospitals.schema'
import {
  buildDefaultAddendumRequirements,
  buildPksDraftLetter,
  printRaporBapHtml,
} from './rapor-rs-detail.utils'

type PolicyKey = PksRecommendationInput['recommendedPolicy']

interface RaporDetailPolicyPanelProps {
  hospital: HospitalDetailItem
  executiveName: string
  unitName: string
  isSubmitting: boolean
  onSaveRecommendation: (input: PksRecommendationInput) => Promise<void>
}

const POLICY_OPTIONS: ReadonlyArray<{
  key: PolicyKey
  label: string
  tone: ConfirmDialogTone
}> = [
  { key: 'pks_bersyarat', label: 'PKS Bersyarat', tone: 'warning' },
  { key: 'teguran_sp1', label: 'Teguran SP-1', tone: 'destructive' },
  { key: 'pembinaan', label: 'Pembinaan RS', tone: 'primary' },
  { key: 'perpanjang', label: 'Perpanjang PKS', tone: 'primary' },
]

export function RaporDetailPolicyPanel({
  hospital,
  executiveName,
  unitName,
  isSubmitting,
  onSaveRecommendation,
}: RaporDetailPolicyPanelProps) {
  const defaultReqs = buildDefaultAddendumRequirements(hospital)

  const [policy, setPolicy] = useState<PolicyKey>(
    hospital.pksDraft?.recommendedPolicy ??
      (hospital.complianceGrade === 'A' ? 'perpanjang' : 'pks_bersyarat'),
  )
  const [selectedReqs, setSelectedReqs] = useState<string[]>(
    hospital.pksDraft?.addendumRequirements.length
      ? hospital.pksDraft.addendumRequirements
      : defaultReqs,
  )
  const [note, setNote] = useState(
    hospital.pksDraft?.executiveNote ??
      `Jadwalkan rapat evaluasi PKS bersama Direktur ${hospital.name} & Tim PK-JKN.`,
  )
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    const nextDefaultReqs = buildDefaultAddendumRequirements(hospital)
    setPolicy(
      hospital.pksDraft?.recommendedPolicy ??
        (hospital.complianceGrade === 'A' ? 'perpanjang' : 'pks_bersyarat'),
    )
    setSelectedReqs(
      hospital.pksDraft?.addendumRequirements.length
        ? hospital.pksDraft.addendumRequirements
        : nextDefaultReqs,
    )
    setNote(
      hospital.pksDraft?.executiveNote ??
        `Jadwalkan rapat evaluasi PKS bersama Direktur ${hospital.name} & Tim PK-JKN.`,
    )
  }, [hospital])

  const draftText = buildPksDraftLetter(hospital, policy, selectedReqs)
  const activeOption =
    POLICY_OPTIONS.find((o) => o.key === policy) ?? POLICY_OPTIONS[0]

  const handleRequestConfirm = () => {
    if (note.trim().length < 5) {
      toast.error('Agenda rapat & instruksi Kepala Cabang minimal 5 karakter.')
      return
    }
    setConfirmOpen(true)
  }

  return (
    <aside className="card-surface space-y-5 p-6">
      <div>
        <h2 className="text-[16px] font-bold leading-snug text-[var(--color-text-primary)]">
          Keputusan Kebijakan &amp; Kontrak PKS
        </h2>
        <p className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
          Wewenang Kepala Cabang · PKS berakhir{' '}
          {formatDateId(hospital.pksExpiresAt)}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {POLICY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setPolicy(opt.key)}
            className={cn(
              'rounded-xl border px-3 py-2 text-[12px] transition-colors',
              policy === opt.key
                ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]'
                : 'border-[var(--color-border-default)] bg-white font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          SYARAT WAJIB ADDENDUM PKS 2027
        </p>
        <div className="space-y-2">
          {defaultReqs.map((req) => {
            const checked = selectedReqs.includes(req)
            return (
              <label
                key={req}
                className="flex cursor-pointer items-center gap-2.5 text-[12px] font-medium text-[var(--color-text-primary)]"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) =>
                    setSelectedReqs((prev) =>
                      v === true
                        ? [...prev, req]
                        : prev.filter((item) => item !== req),
                    )
                  }
                />
                <span>{req}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3.5">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          DRAF BAHAN SURAT e-OFFICE &amp; KLAUSUL PKS
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          &ldquo;{draftText}&rdquo;
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <CopyDraftButton text={draftText} label="Salin Draf Surat" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printRaporBapHtml(hospital, executiveName, unitName)}
          >
            <Download className="size-3.5" aria-hidden="true" />
            <span>Unduh Rapor &amp; BAP</span>
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="pks-executive-note"
          className="gap-1 text-caption-tag uppercase text-[var(--color-text-secondary)]"
        >
          <span>AGENDA RAPAT &amp; INSTRUKSI KEPALA CABANG</span>
          <span className="text-[var(--color-risk-high)]" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id="pks-executive-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Jadwalkan rapat evaluasi PKS bersama direksi rumah sakit..."
          className="resize-none rounded-xl border-[var(--color-border-default)] bg-white text-[13px] leading-relaxed"
        />
      </div>

      <Button
        type="button"
        disabled={isSubmitting}
        onClick={handleRequestConfirm}
        className="h-10 w-full rounded-full bg-[var(--color-action-primary)] font-semibold text-white hover:bg-[var(--color-action-primary-hover)]"
      >
        Tetapkan Rekomendasi &amp; Siapkan Bahan Rapat
      </Button>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone={activeOption.tone}
        title={`Tetapkan Rekomendasi '${activeOption.label}'?`}
        summary={`${hospital.name} · Skor ${hospital.complianceScore}/100 (Grade ${hospital.complianceGrade})`}
        effects={[
          `Status kontrak PKS diperbarui ke ${activeOption.label}.`,
          'Rekomendasi & syarat addendum disiapkan untuk rapat evaluasi di Kebijakan & PKS.',
          'Keputusan dicatat permanen ke Audit Log.',
        ]}
        confirmLabel={`Ya, Tetapkan ${activeOption.label}`}
        isPending={isSubmitting}
        onConfirm={async () => {
          await onSaveRecommendation({
            hospitalId: hospital.id,
            recommendedPolicy: policy,
            addendumRequirements: selectedReqs,
            executiveNote: note.trim(),
          })
          setConfirmOpen(false)
        }}
      />
    </aside>
  )
}
