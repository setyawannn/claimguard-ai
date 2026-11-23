import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import type { ClaimDetailNavigation } from '#/schemas/claims.schema'

interface ClaimDetailHeaderSectionProps {
  claimId: string
  noSep: string
  navigation: ClaimDetailNavigation
}

export function ClaimDetailHeaderSection({
  claimId,
  noSep,
  navigation,
}: ClaimDetailHeaderSectionProps) {
  const shortId = claimId.replace(/^clm-/, '')

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--color-text-primary)]">
          Pemeriksaan Klaim #{shortId}
        </h1>
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)]">
          <Link
            to="/antrean"
            className="font-medium text-[var(--color-action-primary)] hover:underline"
          >
            Antrean
          </Link>
          <span>/</span>
          <span className="font-mono-code text-[12px]">{noSep}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {navigation.index > 0 && (
          <span className="mr-1 text-[12px] font-medium text-[var(--color-text-secondary)]">
            Berkas {navigation.index} dari {navigation.total} Perlu Telaah
          </span>
        )}

        {navigation.prevId ? (
          <Button asChild variant="outlinePill" size="sm" className="h-9 px-3.5 text-[12px]">
            <Link to="/antrean/$claimId" params={{ claimId: navigation.prevId }}>
              ← Sebelumnya
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outlinePill"
            size="sm"
            disabled
            className="h-9 px-3.5 text-[12px]"
          >
            ← Sebelumnya
          </Button>
        )}

        {navigation.nextId ? (
          <Button asChild variant="outlinePill" size="sm" className="h-9 px-3.5 text-[12px]">
            <Link to="/antrean/$claimId" params={{ claimId: navigation.nextId }}>
              Berikutnya →
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outlinePill"
            size="sm"
            disabled
            className="h-9 px-3.5 text-[12px]"
          >
            Berikutnya →
          </Button>
        )}
      </div>
    </div>
  )
}
