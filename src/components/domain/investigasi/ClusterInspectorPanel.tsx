import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmActionDialog } from '#/components/shared/ConfirmActionDialog'
import type { ConfirmDialogTone } from '#/components/shared/ConfirmActionDialog'
import { CopyDraftButton } from '#/components/shared/CopyDraftButton'
import { StatusBadge } from '#/components/shared/StatusBadge'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { formatIdrCompact } from '#/lib/format'
import { cn } from '#/lib/utils'
import type {
  ClusterInvestigationDetail,
  ConstellationNodeInfo,
  GraphNodeKey,
  UpdateClusterStageInput,
} from '#/schemas/clusters.schema'
import {
  buildNodeDraftText,
  exportClusterChronologyCsv,
  printInvestigationDocHtml,
} from './investigasi.utils'

type StageChoice = UpdateClusterStageInput['followupStage']

interface ClusterInspectorPanelProps {
  detail: ClusterInvestigationDetail
  selectedNodeKey: GraphNodeKey
  auditorName: string
  isSubmitting: boolean
  onSubmitStage: (input: UpdateClusterStageInput) => Promise<void>
}

const STAGE_OPTIONS: ReadonlyArray<{
  key: StageChoice
  label: string
  tone: ConfirmDialogTone
}> = [
  { key: 'sidak_fisik', label: 'Sidak Fisik', tone: 'primary' },
  { key: 'tagih_tgr', label: 'Tagih TGR', tone: 'warning' },
  { key: 'evaluasi_pks', label: 'Evaluasi PKS', tone: 'warning' },
  { key: 'limpah_aph', label: 'Limpahkan APH', tone: 'destructive' },
  { key: 'arsip_wajar', label: 'Arsipkan Wajar', tone: 'primary' },
]

const BADGE_STYLE_BY_TONE: Record<
  ConstellationNodeInfo['badgeTone'],
  { badgeClass: string; dotClass: string }
> = {
  high: {
    badgeClass:
      'bg-[var(--color-risk-high-bg)] border-[var(--color-risk-high-border)] text-[var(--color-risk-high-text)]',
    dotClass: 'bg-[var(--color-risk-high)]',
  },
  medium: {
    badgeClass:
      'bg-[var(--color-risk-medium-bg)] border-[var(--color-risk-medium-border)] text-[var(--color-risk-medium-text)]',
    dotClass: 'bg-[var(--color-risk-medium)]',
  },
  primary: {
    badgeClass:
      'bg-[var(--color-action-primary-bg)] border-[var(--color-action-primary-border)] text-[var(--color-action-primary)]',
    dotClass: 'bg-[var(--color-action-primary)]',
  },
}

function resolveInitialStage(
  stage: ClusterInvestigationDetail['followupStage'],
): StageChoice {
  return stage === 'baru' ? 'sidak_fisik' : stage
}

export function ClusterInspectorPanel({
  detail,
  selectedNodeKey,
  auditorName,
  isSubmitting,
  onSubmitStage,
}: ClusterInspectorPanelProps) {
  const [selectedStage, setSelectedStage] = useState<StageChoice>(() =>
    resolveInitialStage(detail.followupStage),
  )
  const [note, setNote] = useState(detail.auditResultNote ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    setSelectedStage(resolveInitialStage(detail.followupStage))
    setNote(detail.auditResultNote ?? '')
  }, [detail.id, detail.followupStage, detail.auditResultNote])

  const node = detail.nodes[selectedNodeKey]
  const stageMeta =
    STAGE_OPTIONS.find((opt) => opt.key === selectedStage) ?? STAGE_OPTIONS[0]

  const handleRequestConfirm = () => {
    if (note.trim().length < 5) {
      toast.error('Catatan tindak lanjut minimal 5 karakter.')
      return
    }
    setConfirmOpen(true)
  }

  return (
    <aside className="card-surface space-y-4 p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-action-primary)]">
            {node.overline}
          </p>
          <h2 className="mt-1 text-[18px] font-bold leading-snug text-[var(--color-text-primary)]">
            {node.title}
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
            {node.subtitle}
          </p>
        </div>
        <StatusBadge
          className="shrink-0 whitespace-nowrap"
          meta={{
            label: node.badgeLabel,
            ...BADGE_STYLE_BY_TONE[node.badgeTone],
          }}
        />
      </div>

      <div className="space-y-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-[12px]">
        <p className="font-medium text-[var(--color-text-primary)]">
          → {node.inboundText}
        </p>
        <p className="font-medium text-[var(--color-risk-high)]">
          ← {node.outboundText}
        </p>
      </div>

      <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
        <strong className="font-semibold text-[var(--color-text-primary)]">
          Temuan:
        </strong>{' '}
        {node.findingText}
      </p>

      <div className="space-y-2 border-t border-[var(--color-border-default)] pt-4">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          DOKUMEN & DRAFT AUDIT TERKAIT SIMPUL INI
        </p>
        <div className="space-y-2">
          {node.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)]/70 px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                  {doc.title}
                </p>
                <p className="truncate text-[11px] text-[var(--color-text-secondary)]">
                  {doc.subtitle}
                </p>
              </div>
              {doc.actionType === 'copy' ? (
                <CopyDraftButton
                  text={buildNodeDraftText(detail, selectedNodeKey)}
                  label="Salin"
                  className="h-8 shrink-0 rounded-lg px-2.5 text-[12px]"
                />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 rounded-lg px-2.5 text-[12px]"
                  onClick={() => {
                    if (doc.actionType === 'csv') {
                      exportClusterChronologyCsv(detail)
                      return
                    }
                    printInvestigationDocHtml(
                      detail,
                      doc.docType ?? 'sidak_checklist',
                      auditorName,
                    )
                  }}
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  <span>Unduh</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-[var(--color-border-default)] pt-4">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          TETAPKAN TINDAK LANJUT WILAYAH
        </p>

        <div className="grid grid-cols-3 gap-2">
          {STAGE_OPTIONS.slice(0, 3).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedStage(opt.key)}
              className={cn(
                'rounded-xl border px-2.5 py-2 text-[12px] transition-colors',
                selectedStage === opt.key
                  ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]'
                  : 'border-[var(--color-border-default)] bg-white font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {STAGE_OPTIONS.slice(3).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedStage(opt.key)}
              className={cn(
                'rounded-xl border px-2.5 py-2 text-[12px] transition-colors',
                selectedStage === opt.key
                  ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]'
                  : 'border-[var(--color-border-default)] bg-white font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="cluster-followup-note"
            className="gap-1 text-caption-tag uppercase text-[var(--color-text-secondary)]"
          >
            <span>CATATAN TINDAK LANJUT</span>
            <span className="text-[var(--color-risk-high)]" aria-hidden="true">
              *
            </span>
          </Label>
          <Textarea
            id="cluster-followup-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cek CCTV Cath Lab & buku register tindakan 1–14 Sep..."
            className="resize-none rounded-xl border-[var(--color-border-default)] bg-white text-[13px] leading-relaxed"
          />
        </div>

        <Button
          type="button"
          disabled={isSubmitting}
          onClick={handleRequestConfirm}
          className="h-10 w-full rounded-full bg-[var(--color-action-primary)] font-semibold text-white hover:bg-[var(--color-action-primary-hover)]"
        >
          Tetapkan Status {stageMeta.label}
        </Button>
      </div>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone={stageMeta.tone}
        title={`Tetapkan Status '${stageMeta.label}' untuk ${detail.clusterCode}?`}
        summary={`${detail.hospitalName} · ${detail.escalatedClaimCount} klaim (${formatIdrCompact(detail.potentialLossIdr)})`}
        effects={[
          `Tahap kluster diperbarui menjadi ${stageMeta.label}.`,
          selectedStage === 'evaluasi_pks'
            ? 'Status PKS rumah sakit otomatis ditandai Evaluasi PKS untuk Kepala Cabang.'
            : 'Kluster tersedia pada daftar Tindak Lanjut & Rekap Wilayah.',
          'Penetapan keputusan dicatat permanen ke Audit Log.',
        ]}
        confirmLabel={`Ya, Tetapkan ${stageMeta.label}`}
        isPending={isSubmitting}
        onConfirm={async () => {
          await onSubmitStage({
            clusterId: detail.id,
            followupStage: selectedStage,
            note: note.trim(),
          })
          setConfirmOpen(false)
        }}
      />
    </aside>
  )
}
