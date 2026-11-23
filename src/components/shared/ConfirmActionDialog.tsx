import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { cn } from '#/lib/utils'

export type ConfirmDialogTone = 'primary' | 'warning' | 'destructive'

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tone?: ConfirmDialogTone
  title: string
  description?: string
  summary?: string
  effects: readonly string[]
  confirmLabel: string
  cancelLabel?: string
  requireNote?: boolean
  noteLabel?: string
  notePlaceholder?: string
  defaultNote?: string
  isPending?: boolean
  onConfirm: (note: string) => void | Promise<void>
}

const TONE_ICON_STYLE: Record<ConfirmDialogTone, string> = {
  primary:
    'border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary)]',
  warning:
    'border-[var(--color-risk-medium-border)] bg-[var(--color-risk-medium-bg)] text-[var(--color-risk-medium)]',
  destructive:
    'border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] text-[var(--color-risk-high)]',
}

const CONFIRM_BTN_STYLE: Record<ConfirmDialogTone, string> = {
  primary:
    'bg-[var(--color-action-primary)] text-white hover:bg-[var(--color-action-primary-hover)]',
  warning:
    'bg-[var(--color-risk-medium)] text-white hover:bg-[#b45309]',
  destructive:
    'bg-[var(--color-risk-high)] text-white hover:bg-[#b91c1c]',
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  tone = 'primary',
  title,
  description,
  summary,
  effects,
  confirmLabel,
  cancelLabel = 'Batal',
  requireNote = false,
  noteLabel = 'Catatan Keputusan',
  notePlaceholder = 'Tuliskan dasar verifikasi singkat...',
  defaultNote = '',
  isPending = false,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [note, setNote] = useState(defaultNote)

  useEffect(() => {
    if (open) setNote(defaultNote)
  }, [open, defaultNote])

  const Icon =
    tone === 'destructive'
      ? ShieldAlert
      : tone === 'warning'
        ? AlertTriangle
        : CheckCircle2

  const handleConfirmClick = async () => {
    const trimmed = note.trim()
    if (requireNote && trimmed.length < 3) {
      toast.error('Catatan keputusan minimal 3 karakter.')
      return
    }
    await onConfirm(trimmed)
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialogContent className="border-[var(--color-border-default)] bg-[var(--color-bg-surface)] sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full border',
                TONE_ICON_STYLE[tone],
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="space-y-1 text-left">
              <AlertDialogTitle className="text-[16px] font-bold text-[var(--color-text-primary)]">
                {title}
              </AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="text-[13px] leading-snug text-[var(--color-text-secondary)]">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3">
          {summary && (
            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--color-text-primary)]">
              {summary}
            </div>
          )}

          {effects.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                Efek tindakan:
              </p>
              <ul className="list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                {effects.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {requireNote && (
            <div className="space-y-1.5">
              <Label
                htmlFor="confirm-audit-note"
                className="gap-1 text-[12px] font-semibold text-[var(--color-text-primary)]"
              >
                <span>{noteLabel}</span>
                <span className="text-[var(--color-risk-high)]" aria-hidden="true">
                  *
                </span>
              </Label>
              <Textarea
                id="confirm-audit-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={notePlaceholder}
                disabled={isPending}
                className="resize-none border-[var(--color-border-default)] bg-white text-[13px]"
              />
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleConfirmClick}
            className={cn('font-semibold', CONFIRM_BTN_STYLE[tone])}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
