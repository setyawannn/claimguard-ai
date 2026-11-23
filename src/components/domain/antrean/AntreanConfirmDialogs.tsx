import { ConfirmActionDialog } from '#/components/shared/ConfirmActionDialog'
import { formatIdrCompact } from '#/lib/format'
import type { ClaimQueueItem, ClaimsQueueSummary } from '#/schemas/claims.schema'

export type AntreanConfirmMode =
  | 'fast_track'
  | 'bulk_clarify'
  | 'bulk_approve'
  | null

interface AntreanConfirmDialogsProps {
  mode: AntreanConfirmMode
  onClose: () => void
  summary: ClaimsQueueSummary
  selectedItems: readonly ClaimQueueItem[]
  selectedAmountIdr: number
  isFastTrackPending: boolean
  isBulkPending: boolean
  onConfirmFastTrack: () => Promise<void>
  onConfirmBulk: (
    action: 'disetujui' | 'klarifikasi',
    note: string,
  ) => Promise<void>
}

export function AntreanConfirmDialogs({
  mode,
  onClose,
  summary,
  selectedItems,
  selectedAmountIdr,
  isFastTrackPending,
  isBulkPending,
  onConfirmFastTrack,
  onConfirmBulk,
}: AntreanConfirmDialogsProps) {
  return (
    <>
      <ConfirmActionDialog
        open={mode === 'fast_track'}
        onOpenChange={(open) => !open && onClose()}
        tone="primary"
        title="Setujui Klaim Zona Hijau (Fast-Track)?"
        description="Semua berkas berstatus Belum Dicek dengan skor AI 0–39 disahkan tanpa telaah manual."
        summary={`${summary.fastTrackCount} berkas zona hijau · Total ${formatIdrCompact(summary.fastTrackAmountIdr)}`}
        effects={[
          'Status seluruh berkas berubah menjadi Disetujui dan keluar dari antrean.',
          'Tagihan masuk ke daftar klaim siap pencairan periode berjalan.',
          'Keputusan tercatat permanen pada Audit Log D1.',
        ]}
        confirmLabel="Ya, Setujui Sekaligus"
        isPending={isFastTrackPending}
        onConfirm={onConfirmFastTrack}
      />

      <ConfirmActionDialog
        open={mode === 'bulk_approve'}
        onOpenChange={(open) => !open && onClose()}
        tone="primary"
        title={`Setujui ${selectedItems.length} Berkas Terpilih?`}
        description="Pastikan kelengkapan klinis berkas yang dipilih sudah sesuai sebelum pengesahan."
        summary={`${selectedItems.length} berkas dipilih · Total ${formatIdrCompact(selectedAmountIdr)}`}
        effects={[
          `Status ${selectedItems.length} berkas berubah menjadi Disetujui.`,
          'Berkas berpindah ke tab Selesai Diputuskan.',
          'Catatan alasan tercatat permanen di Audit Log D1.',
        ]}
        requireNote
        notePlaceholder="Contoh: Resume medis dan tarif INA-CBG sudah terverifikasi sesuai."
        confirmLabel={`Setujui ${selectedItems.length} Berkas`}
        isPending={isBulkPending}
        onConfirm={(note) => onConfirmBulk('disetujui', note)}
      />

      <ConfirmActionDialog
        open={mode === 'bulk_clarify'}
        onOpenChange={(open) => !open && onClose()}
        tone="warning"
        title={`Minta Klarifikasi ke Rumah Sakit (${selectedItems.length} Berkas)?`}
        description="Pembayaran klaim ditahan sementara hingga RS mengunggah bukti klarifikasi."
        summary={`${selectedItems.length} berkas dipilih · Total ditahan ${formatIdrCompact(selectedAmountIdr)}`}
        effects={[
          `Status ${selectedItems.length} berkas berubah ke Klarifikasi (tahan bayar).`,
          'Batas SLA balasan Rumah Sakit dimulai sejak konfirmasi ini.',
          'Permintaan klarifikasi tercatat permanen di Audit Log D1.',
        ]}
        requireNote
        notePlaceholder="Contoh: Mohon lampirkan laporan tindakan & bukti pendukung klinis."
        confirmLabel={`Kirim Klarifikasi (${selectedItems.length})`}
        isPending={isBulkPending}
        onConfirm={(note) => onConfirmBulk('klarifikasi', note)}
      />
    </>
  )
}
