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
import { CLUSTER_STAGE_META } from '#/lib/status-tokens'
import { cn } from '#/lib/utils'
import type {
  ClusterFieldChecklist,
  ClusterFinalizeInput,
  ClusterFollowupItem,
} from '#/schemas/clusters.schema'
import { FINAL_STATUS_META } from './tindak-lanjut.utils'

type FinalAuditChoice = 'tagih_tgr' | 'kirim_pak_rudi' | 'proses_aph' | 'arsip_wajar'

interface TindakLanjutPanelProps {
  cluster: ClusterFollowupItem | null
  isSubmitting: boolean
  onFinalize: (input: ClusterFinalizeInput) => Promise<void>
}

const FINAL_CHOICE_OPTIONS: ReadonlyArray<{
  key: FinalAuditChoice
  label: string
  followupStage: ClusterFinalizeInput['followupStage']
  tone: ConfirmDialogTone
  activeClass: string
}> = [
  {
    key: 'tagih_tgr',
    label: 'Tagih TGR',
    followupStage: 'tagih_tgr',
    tone: 'warning',
    activeClass:
      'border-[var(--color-risk-high)] bg-[var(--color-risk-high-bg)] font-semibold text-[var(--color-risk-high-text)]',
  },
  {
    key: 'kirim_pak_rudi',
    label: 'Evaluasi PKS',
    followupStage: 'evaluasi_pks',
    tone: 'primary',
    activeClass:
      'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)] font-semibold text-[var(--color-action-primary)]',
  },
  {
    key: 'proses_aph',
    label: 'Limpahkan APH',
    followupStage: 'limpah_aph',
    tone: 'destructive',
    activeClass:
      'border-[var(--color-risk-high)] bg-[var(--color-risk-high-bg)] font-semibold text-[var(--color-risk-high-text)]',
  },
  {
    key: 'arsip_wajar',
    label: 'Arsip Wajar',
    followupStage: 'arsip_wajar',
    tone: 'primary',
    activeClass:
      'border-[var(--color-risk-low)] bg-[var(--color-risk-low-bg)] font-semibold text-[var(--color-risk-low-text)]',
  },
]

function resolveInitialFinalChoice(
  item: ClusterFollowupItem,
): FinalAuditChoice {
  if (
    item.finalStatus === 'tagih_tgr' ||
    item.finalStatus === 'kirim_pak_rudi' ||
    item.finalStatus === 'proses_aph' ||
    item.finalStatus === 'arsip_wajar'
  ) {
    return item.finalStatus
  }
  if (item.followupStage === 'evaluasi_pks') return 'kirim_pak_rudi'
  if (item.followupStage === 'limpah_aph') return 'proses_aph'
  if (item.followupStage === 'arsip_wajar') return 'arsip_wajar'
  return 'tagih_tgr'
}

export function TindakLanjutPanel({
  cluster,
  isSubmitting,
  onFinalize,
}: TindakLanjutPanelProps) {
  const [checklist, setChecklist] = useState<ClusterFieldChecklist>({
    cctvChecked: true,
    registerMatched: true,
    bapSigned: true,
  })
  const [selectedChoice, setSelectedChoice] =
    useState<FinalAuditChoice>('tagih_tgr')
  const [tgrAmountText, setTgrAmountText] = useState('')
  const [note, setNote] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!cluster) return
    const hasChecklist =
      cluster.checklist.cctvChecked ||
      cluster.checklist.registerMatched ||
      cluster.checklist.bapSigned
    setChecklist(
      hasChecklist
        ? cluster.checklist
        : { cctvChecked: true, registerMatched: true, bapSigned: false },
    )
    setSelectedChoice(resolveInitialFinalChoice(cluster))
    const defaultTgr =
      cluster.agreedTgrIdr > 0
        ? cluster.agreedTgrIdr
        : cluster.potentialLossIdr
    setTgrAmountText(formatThousandsId(String(defaultTgr)))
    setNote(cluster.auditResultNote ?? '')
  }, [
    cluster?.id,
    cluster?.finalStatus,
    cluster?.followupStage,
    cluster?.agreedTgrIdr,
    cluster?.potentialLossIdr,
    cluster?.auditResultNote,
    cluster?.checklist.cctvChecked,
    cluster?.checklist.registerMatched,
    cluster?.checklist.bapSigned,
  ])

  if (!cluster) {
    return (
      <aside className="card-surface p-6">
        <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">
          Catat Hasil & Status Akhir Audit
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
          Pilih salah satu kasus pada tabel di sebelah kiri untuk mencatat bukti
          pemeriksaan lapangan dan menetapkan status akhir audit wilayah.
        </p>
      </aside>
    )
  }

  const activeOption =
    FINAL_CHOICE_OPTIONS.find((o) => o.key === selectedChoice) ??
    FINAL_CHOICE_OPTIONS[0]

  const needsTgrInput =
    selectedChoice === 'tagih_tgr' || selectedChoice === 'kirim_pak_rudi'
  const parsedTgr = Number(tgrAmountText.replace(/\D/g, ''))
  const finalTgrIdr =
    needsTgrInput && Number.isFinite(parsedTgr) ? parsedTgr : 0

  const handleRequestConfirm = () => {
    if (note.trim().length < 5) {
      toast.error('Catatan hasil audit minimal 5 karakter.')
      return
    }
    setConfirmOpen(true)
  }

  return (
    <aside className="card-surface space-y-5 p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold leading-snug text-[var(--color-text-primary)]">
            Catat Hasil & Status Akhir Audit
          </h2>
          <p className="mt-1 truncate font-mono-code text-[11px] text-[var(--color-text-secondary)]">
            {cluster.clusterCode} · {cluster.hospitalName}
          </p>
        </div>
        <StatusBadge
          meta={CLUSTER_STAGE_META[cluster.followupStage]}
          className="shrink-0 whitespace-nowrap"
        />
      </div>

      <div className="space-y-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-3.5">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          INSTRUKSI SIDAK AWAL ({formatDateId(cluster.eventDateIso).toUpperCase()})
        </p>
        <p className="text-[12px] leading-relaxed text-[var(--color-text-primary)]">
          {cluster.initialInstruction}
        </p>
      </div>

      <div className="space-y-2.5">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          BUKTI LAPANGAN DITEMUKAN
        </p>
        <div className="space-y-2">
          {(
            [
              {
                key: 'cctvChecked',
                label: 'Rekaman CCTV Unit / IGD Diperiksa',
              },
              {
                key: 'registerMatched',
                label: 'Buku Register Tindakan Fisik Dicocokkan',
              },
              {
                key: 'bapSigned',
                label: 'BAP Lapangan Ditandatangani Direksi RS',
              },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-[var(--color-text-primary)]"
            >
              <Checkbox
                checked={checklist[item.key]}
                onCheckedChange={(v) =>
                  setChecklist((prev) => ({
                    ...prev,
                    [item.key]: v === true,
                  }))
                }
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-caption-tag uppercase text-[var(--color-text-secondary)]">
          TETAPKAN STATUS AKHIR AUDIT
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FINAL_CHOICE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedChoice(opt.key)}
              className={cn(
                'rounded-xl border px-3 py-2 text-[12px] transition-colors',
                selectedChoice === opt.key
                  ? opt.activeClass
                  : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {needsTgrInput && (
        <div className="space-y-1.5">
          <Label
            htmlFor="tindak-lanjut-tgr"
            className="text-[12px] font-semibold text-[var(--color-text-secondary)]"
          >
            Nilai Pemulihan Dana (TGR)
          </Label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-code text-[12px] font-semibold text-[var(--color-text-secondary)]"
              aria-hidden="true"
            >
              Rp
            </span>
            <Input
              id="tindak-lanjut-tgr"
              inputMode="numeric"
              value={tgrAmountText}
              onChange={(e) =>
                setTgrAmountText(formatThousandsId(e.target.value))
              }
              placeholder="485.000.000"
              className="border-[var(--color-border-default)] bg-white pl-10 font-mono-code text-[12px]"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="tindak-lanjut-note"
          className="gap-1 text-caption-tag uppercase text-[var(--color-text-secondary)]"
        >
          <span>CATATAN AKHIR AUDIT</span>
          <span className="text-[var(--color-risk-high)]" aria-hidden="true">
            *
          </span>
        </Label>
        <Textarea
          id="tindak-lanjut-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tuliskan hasil pemeriksaan bukti fisik, besaran TGR, atau kesimpulan audit..."
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
          Simpan Hasil & Status Akhir
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full text-[12px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-action-primary)]"
        >
          <Link
            to="/investigasi"
            search={{
              clusterId: cluster.id,
              branchCode: cluster.branchCode,
            }}
          >
            <span>Buka Peta Jejaring Kluster</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone={activeOption.tone}
        title={`Simpan Status '${FINAL_STATUS_META[selectedChoice].label}' untuk ${cluster.clusterCode}?`}
        summary={`${cluster.hospitalName}${finalTgrIdr > 0 ? ` · Pemulihan ${formatIdr(finalTgrIdr)}` : ''}`}
        effects={[
          `Status akhir kluster ditetapkan menjadi ${FINAL_STATUS_META[selectedChoice].label}.`,
          needsTgrInput
            ? 'Beban TGR & status evaluasi PKS rumah sakit otomatis disinkronkan untuk Pak Rudi (Kepala Cabang).'
            : 'Hasil bukti lapangan dan catatan audit disimpan permanen.',
          'Seluruh perubahan dicatat ke Audit Log.',
        ]}
        confirmLabel={`Ya, Simpan ${activeOption.label}`}
        isPending={isSubmitting}
        onConfirm={async () => {
          await onFinalize({
            clusterId: cluster.id,
            followupStage: activeOption.followupStage,
            finalStatus: selectedChoice,
            agreedTgrIdr: finalTgrIdr,
            checklist,
            auditResultNote: note.trim(),
          })
          setConfirmOpen(false)
        }}
      />
    </aside>
  )
}
