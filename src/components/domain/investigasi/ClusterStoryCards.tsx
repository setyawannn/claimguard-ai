import type { ClusterStoryCard } from '#/schemas/clusters.schema'
import { cn } from '#/lib/utils'

interface ClusterStoryCardsProps {
  cards: readonly ClusterStoryCard[]
}

const TITLE_TONE_CLASS: Record<ClusterStoryCard['tone'], string> = {
  primary: 'text-[var(--color-action-primary)]',
  high: 'text-[var(--color-risk-high)]',
  medium: 'text-[var(--color-risk-medium)]',
}

export function ClusterStoryCards({ cards }: ClusterStoryCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div key={card.step} className="card-surface p-4">
          <p
            className={cn(
              'text-[11px] font-bold uppercase tracking-wide',
              TITLE_TONE_CLASS[card.tone],
            )}
          >
            {card.title}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
            {card.description}
          </p>
        </div>
      ))}
    </section>
  )
}
