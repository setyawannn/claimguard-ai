import { useState } from 'react'
import { Loader2, MessageSquarePlus } from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { formatDateId, formatSlaRemaining } from '#/lib/format'
import { CLAIM_STATUS_META } from '#/lib/status-tokens'
import type { ClaimDetailItem } from '#/schemas/claims.schema'

interface ClaimConfirmationStatusSectionProps {
  claim: ClaimDetailItem
  verifikatorName: string
  isRecording: boolean
  onRecordResponse: (responseNote: string) => Promise<void>
}

export function ClaimConfirmationStatusSection({
  claim,
  verifikatorName,
  isRecording,
  onRecordResponse,
}: ClaimConfirmationStatusSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [responseNote, setResponseNote] = useState('')

  const hasConfirmedResponse =
    claim.status === 'balasan_rs' || Boolean(claim.hospitalResponseNote)
  const isFinal =
    claim.status === 'disetujui' ||
    claim.status === 'false_positive' ||
    claim.status === 'ditolak'

  const handleSaveResponse = async () => {
    const trimmed = responseNote.trim()
    if (trimmed.length < 5) {
      toast.error('Ringkasan balasan RS minimal 5 karakter.')
      return
    }
    await onRecordResponse(trimmed)
    setResponseNote('')
    setDialogOpen(false)
  }

  return (
    <section className="card-surface space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-bold text-[var(--color-text-primary)]">
          Status Konfirmasi Rumah Sakit
        </h2>
        <div className="flex items-center gap-2">
          <StatusBadge meta={CLAIM_STATUS_META[claim.status]} />
          {!isFinal && (
            <Button
              type="button"
              variant="outlinePill"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="h-8 gap-1.5 px-3 text-[12px]"
            >
              <MessageSquarePlus className="size-3.5" aria-hidden="true" />
              <span>Catat Balasan RS</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
            RESPON KONFIRMASI RS
          </p>
          <p className="text-[13px] font-bold text-[var(--color-text-primary)]">
            {hasConfirmedResponse
              ? 'Konfirmasi RS Sudah Dicatat'
              : 'Belum Ada Konfirmasi RS'}
          </p>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            {claim.hospitalResponseNote
              ? `${claim.hospitalResponseNote}${claim.hospitalRespondedAt ? ` (${formatDateId(claim.hospitalRespondedAt)})` : ''}`
              : `Menunggu lampiran RS melalui e-Office · ${formatSlaRemaining(claim.slaDueAt)}`}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
            STATUS AKHIR KLAIM
          </p>
          <p className="text-[13px] font-bold text-[var(--color-text-primary)]">
            {isFinal
              ? CLAIM_STATUS_META[claim.status].label
              : `Siap Putusan ${verifikatorName}`}
          </p>
          <p className="text-[12px] text-[var(--color-text-secondary)]">
            {claim.decisionNote
              ? claim.decisionNote
              : 'Pilih status akhir di panel kanan & tulis alasan keputusan'}
          </p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !isRecording && setDialogOpen(open)}>
        <DialogContent className="bg-[var(--color-bg-surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Balasan Konfirmasi RS</DialogTitle>
            <DialogDescription>
              Salin ringkasan dokumen atau jawaban RS dari e-Office agar status
              berkas siap diputuskan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label
              htmlFor="rs-response-note"
              className="gap-1 text-[12px] font-semibold text-[var(--color-text-primary)]"
            >
              <span>Ringkasan Balasan RS</span>
              <span className="text-[var(--color-risk-high)]" aria-hidden="true">
                *
              </span>
            </Label>
            <Textarea
              id="rs-response-note"
              rows={3}
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder="Contoh: RS melampirkan EKG darurat & hasil Troponin I (13 Sep 2026)."
              disabled={isRecording}
              className="resize-none border-[var(--color-border-default)] bg-white text-[13px]"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isRecording}
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isRecording}
              onClick={handleSaveResponse}
              className="bg-[var(--color-action-primary)] text-white hover:bg-[var(--color-action-primary-hover)]"
            >
              {isRecording ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                'Simpan Balasan RS'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
