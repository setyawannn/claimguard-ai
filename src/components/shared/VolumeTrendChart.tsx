import { useId, useState } from 'react'
import { formatIdrCompact } from '#/lib/format'
import { cn } from '#/lib/utils'

export interface VolumeTrendPoint {
  label: string
  claimsCount: number
  amountIdr: number
  highlight?: boolean
}

interface VolumeTrendChartProps {
  points: readonly VolumeTrendPoint[]
  className?: string
}

const SVG_W = 240
const SVG_H = 56
const PAD_Y = 8

function buildSmoothPath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return ''
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`

  let d = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[Math.min(coords.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

export function VolumeTrendChart({
  points,
  className,
}: VolumeTrendChartProps) {
  const gradId = useId()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (points.length === 0) return null

  const counts = points.map((p) => p.claimsCount)
  const minVal = Math.min(...counts)
  const maxVal = Math.max(...counts)
  const span = Math.max(1, maxVal - minVal)

  const coords = points.map((pt, idx) => {
    const ratioX = points.length === 1 ? 0.5 : idx / (points.length - 1)
    const ratioY = (pt.claimsCount - minVal) / span
    const x = ratioX * SVG_W
    const y = SVG_H - PAD_Y - ratioY * (SVG_H - PAD_Y * 2)
    return {
      x,
      y,
      xPct: ratioX * 100,
      yPct: (y / SVG_H) * 100,
    }
  })

  const linePath = buildSmoothPath(coords)
  const last = coords[coords.length - 1]
  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${SVG_H} L ${coords[0].x.toFixed(2)} ${SVG_H} Z`
  const activePoint = activeIndex !== null ? points[activeIndex] : null
  const activeCoord = activeIndex !== null ? coords[activeIndex] : null

  return (
    <div className={cn('space-y-2 pt-1', className)}>
      <div
        className="relative h-14 w-full select-none"
        onMouseLeave={() => setActiveIndex(null)}
      >
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-action-primary)"
                stopOpacity="0.16"
              />
              <stop
                offset="100%"
                stopColor="var(--color-action-primary)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-action-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {activeCoord && activePoint && (
          <>
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px border-l border-dashed border-[var(--color-action-primary)]/50"
              style={{ left: `${activeCoord.xPct}%` }}
            />
            <div
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-action-primary)] shadow-xs"
              style={{
                left: `${activeCoord.xPct}%`,
                top: `${activeCoord.yPct}%`,
              }}
            />
            <div
              role="status"
              className={cn(
                'pointer-events-none absolute -top-2 z-20 -translate-y-full whitespace-nowrap rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 shadow-sm',
                activeIndex === 0
                  ? 'left-0'
                  : activeIndex === points.length - 1
                    ? 'right-0'
                    : '-translate-x-1/2',
              )}
              style={
                activeIndex !== 0 && activeIndex !== points.length - 1
                  ? { left: `${activeCoord.xPct}%` }
                  : undefined
              }
            >
              <p className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                {activePoint.label}
              </p>
              <p className="text-[11px] font-bold tabular-nums text-[var(--color-text-primary)]">
                {activePoint.claimsCount.toLocaleString('id-ID')} berkas ·{' '}
                {formatIdrCompact(activePoint.amountIdr)}
              </p>
            </div>
          </>
        )}

        <div className="absolute inset-0 flex">
          {points.map((pt, idx) => (
            <button
              key={pt.label}
              type="button"
              aria-label={`${pt.label}: ${pt.claimsCount.toLocaleString('id-ID')} berkas, ${formatIdrCompact(pt.amountIdr)}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onFocus={() => setActiveIndex(idx)}
              onBlur={() => setActiveIndex(null)}
              className="h-full flex-1 cursor-crosshair bg-transparent focus-visible:outline-none"
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {points.map((pt, idx) => {
          const isCurrent = pt.highlight || activeIndex === idx
          return (
            <span
              key={pt.label}
              className={cn(
                'text-[10px] transition-colors',
                isCurrent
                  ? 'font-semibold text-[var(--color-action-primary)]'
                  : 'font-medium text-[var(--color-line-connector)]',
              )}
            >
              {pt.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
