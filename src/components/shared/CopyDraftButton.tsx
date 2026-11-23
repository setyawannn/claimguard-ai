import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { copyToClipboard } from '#/lib/format'

interface CopyDraftButtonProps {
  text: string
  label?: string
  successMessage?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm'
  className?: string
}

export function CopyDraftButton({
  text,
  label = 'Salin Draf',
  successMessage = 'Teks berhasil disalin ke clipboard',
  variant = 'outline',
  size = 'sm',
  className,
}: CopyDraftButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(text)
    if (!ok) {
      toast.error('Gagal menyalin ke clipboard')
      return
    }
    setCopied(true)
    toast.success(successMessage)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <Check className="size-3.5 text-[var(--color-risk-low)]" />
      ) : (
        <Copy className="size-3.5" />
      )}
      <span>{copied ? 'Tersalin' : label}</span>
    </Button>
  )
}
