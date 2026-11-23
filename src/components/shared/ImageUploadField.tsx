import { useState, type ChangeEvent } from 'react'
import { FileCheck2, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '#/components/ui/label'
import {
  compressImageBeforeUpload,
  type CompressionPreset,
} from '#/lib/image-compressor'
import { cn } from '#/lib/utils'

const MAX_UPLOAD_BYTES = 500 * 1024

interface ImageUploadFieldProps {
  id?: string
  label: string
  preset?: CompressionPreset
  onCompressedFile: (file: File) => void
  className?: string
}

export function ImageUploadField({
  id = 'evidence-upload',
  label,
  preset = 'document',
  onCompressedFile,
  className,
}: ImageUploadFieldProps) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsCompressing(true)
    try {
      const compressed = await compressImageBeforeUpload(file, preset)
      if (compressed.size > MAX_UPLOAD_BYTES) {
        toast.error('Ukuran file setelah kompresi melebihi batas 500 KB.')
        return
      }
      const kb = Math.max(1, Math.round(compressed.size / 1024))
      setSummary(`${compressed.name} (${kb} KB · WebP)`)
      onCompressedFile(compressed)
      toast.success(`Gambar terkompresi menjadi ${kb} KB (WebP)`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Gagal memproses gambar.',
      )
    } finally {
      setIsCompressing(false)
      e.target.value = ''
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-caption-label">
        {label}
      </Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-node)] border border-dashed border-[var(--color-border-dashed)] bg-[var(--color-bg-canvas)] px-3.5 py-2.5 text-sm transition-colors hover:border-[var(--color-action-primary)]"
      >
        <span className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          {isCompressing ? (
            <Loader2 className="size-4 animate-spin text-[var(--color-action-primary)]" />
          ) : summary ? (
            <FileCheck2 className="size-4 text-[var(--color-risk-low)]" />
          ) : (
            <Upload className="size-4" />
          )}
          <span className="truncate">
            {isCompressing
              ? 'Mengompresi ke WebP...'
              : (summary ?? 'Pilih gambar bukti (otomatis WebP < 250 KB)')}
          </span>
        </span>
        <input
          id={id}
          type="file"
          accept="image/*"
          disabled={isCompressing}
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>
    </div>
  )
}
