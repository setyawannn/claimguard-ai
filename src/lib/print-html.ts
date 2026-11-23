import { toast } from 'sonner'

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function printHtmlDocument(
  html: string,
  errorMessage = 'Gagal menyiapkan pratinjau cetak dokumen.',
): void {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove()
    }, 300)
  }

  iframe.onload = () => {
    const win = iframe.contentWindow
    if (!win) {
      cleanup()
      toast.error(errorMessage)
      return
    }
    win.addEventListener('afterprint', cleanup, { once: true })
    win.focus()
    win.print()
    window.setTimeout(cleanup, 60_000)
  }

  document.body.appendChild(iframe)
  iframe.srcdoc = html
}
