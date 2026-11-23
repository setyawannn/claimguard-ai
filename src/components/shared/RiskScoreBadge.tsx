import { RISK_ZONE_META, getRiskZone } from '#/lib/status-tokens'
import { cn } from '#/lib/utils'

interface RiskScoreBadgeProps {
  score: number
  prefix?: string
  className?: string
}

export function RiskScoreBadge({
  score,
  prefix = 'Skor',
  className,
}: RiskScoreBadgeProps) {
  const zone = getRiskZone(score)
  const meta = RISK_ZONE_META[zone]

  return (
    <span
      className={cn(
        'badge-pill font-mono-code',
        meta.badgeClass,
        className,
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', meta.dotClass)}
        aria-hidden="true"
      />
      <span>
        {prefix} {score}
      </span>
    </span>
  )
}
