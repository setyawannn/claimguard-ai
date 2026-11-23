import { useState } from 'react'
import { Building2, Minus, Plus } from 'lucide-react'
import { RiskScoreBadge } from '#/components/shared/RiskScoreBadge'
import { cn } from '#/lib/utils'
import type {
  ClusterInvestigationDetail,
  GraphNodeKey,
  InvestigationClusterOption,
} from '#/schemas/clusters.schema'

interface ConstellationGraphSvgProps {
  detail: ClusterInvestigationDetail
  allClusters: readonly InvestigationClusterOption[]
  selectedNodeKey: GraphNodeKey
  onSelectNode: (key: GraphNodeKey) => void
  onSelectCluster: (clusterId: string, branchCode?: string) => void
}

interface NodeCardBoxProps {
  nodeKey: GraphNodeKey
  tag: string
  title: string
  meta: string
  selected: boolean
  isHub?: boolean
  className: string
  onClick: () => void
}

function NodeCardBox({
  tag,
  title,
  meta,
  selected,
  isHub = false,
  className,
  onClick,
}: NodeCardBoxProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'absolute flex flex-col justify-center rounded-[12px] border bg-white px-4 py-3 text-left transition-all',
        isHub
          ? selected
            ? 'border-[1.8px] border-[var(--color-risk-high)] shadow-[0_0_0_4px_rgba(220,38,38,0.12)]'
            : 'border-[1.5px] border-[var(--color-risk-high)]/75 hover:border-[var(--color-risk-high)]'
          : selected
            ? 'border-[1.8px] border-[var(--color-action-primary)] shadow-[0_0_0_4px_rgba(37,99,235,0.12)]'
            : 'border-[var(--color-border-default)] hover:border-[var(--color-action-primary-border)]',
        className,
      )}
    >
      <span
        className={cn(
          'text-[10px] font-bold uppercase tracking-wide',
          isHub
            ? 'text-[var(--color-risk-high)]'
            : 'text-[var(--color-text-secondary)]',
        )}
      >
        {tag}
      </span>
      <span className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-[var(--color-text-primary)]">
        {title}
      </span>
      <span
        className={cn(
          'mt-0.5 truncate text-[11px]',
          isHub
            ? 'font-medium text-[var(--color-risk-high)]'
            : 'text-[var(--color-text-secondary)]',
        )}
      >
        {meta}
      </span>
    </button>
  )
}

export function ConstellationGraphSvg({
  detail,
  allClusters,
  selectedNodeKey,
  onSelectNode,
  onSelectCluster,
}: ConstellationGraphSvgProps) {
  const [activeTab, setActiveTab] = useState<'graph' | 'branches'>('graph')
  const [zoomPct, setZoomPct] = useState(100)

  const scale = zoomPct / 100
  const stageW = Math.round(760 * scale)
  const stageH = Math.round(430 * scale)

  const branchesMap = new Map<string, InvestigationClusterOption[]>()
  for (const item of allClusters) {
    const list = branchesMap.get(item.branchName) ?? []
    list.push(item)
    branchesMap.set(item.branchName, list)
  }

  return (
    <section className="card-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Tampilan Investigasi Wilayah"
          className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'graph'}
            onClick={() => setActiveTab('graph')}
            className={cn(
              'rounded-full px-4 py-1.5 text-[12px] transition-colors',
              activeTab === 'graph'
                ? 'bg-[var(--color-action-primary)] font-semibold text-white'
                : 'font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            Peta Konstelasi Relasi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'branches'}
            onClick={() => setActiveTab('branches')}
            className={cn(
              'rounded-full px-4 py-1.5 text-[12px] transition-colors',
              activeTab === 'branches'
                ? 'bg-[var(--color-action-primary)] font-semibold text-white'
                : 'font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            Sebaran Wilayah Jatim (4 KC)
          </button>
        </div>

        {activeTab === 'graph' && (
          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 py-1 text-[12px] text-[var(--color-text-secondary)]">
            <button
              type="button"
              aria-label="Perkecil peta"
              disabled={zoomPct <= 75}
              onClick={() => setZoomPct((z) => Math.max(75, z - 10))}
              className="flex size-6 items-center justify-center rounded-full hover:bg-[var(--color-bg-muted)] disabled:opacity-40"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-10 text-center font-mono-code text-[11px] text-[var(--color-text-primary)]">
              {zoomPct}%
            </span>
            <button
              type="button"
              aria-label="Perbesar peta"
              disabled={zoomPct >= 120}
              onClick={() => setZoomPct((z) => Math.min(120, z + 10))}
              className="flex size-6 items-center justify-center rounded-full hover:bg-[var(--color-bg-muted)] disabled:opacity-40"
            >
              <Plus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomPct(100)}
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
            >
              Fit
            </button>
          </div>
        )}
      </div>

      {activeTab === 'graph' ? (
        <>
          <div className="mt-4 overflow-x-auto rounded-[16px] border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)]/70 p-3">
            <div
              className="relative mx-auto"
              style={{ width: `${stageW}px`, height: `${stageH}px` }}
            >
              <div
                className="relative h-[430px] w-[760px] origin-top-left"
                style={{ transform: `scale(${scale})` }}
              >
                <svg
                  viewBox="0 0 760 430"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id="arrow-blue"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#2563EB" />
                    </marker>
                    <marker
                      id="arrow-red"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#DC2626" />
                    </marker>
                    <marker
                      id="arrow-amber"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#D97706" />
                    </marker>
                  </defs>

                  <ellipse
                    cx="382"
                    cy="226"
                    rx="145"
                    ry="78"
                    fill="#FEF2F2"
                    fillOpacity="0.85"
                    stroke="#FECACA"
                    strokeWidth="1.2"
                  />

                  <path
                    d="M 226 138 C 254 138, 250 214, 274 214"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    markerEnd="url(#arrow-blue)"
                  />
                  <path
                    d="M 226 312 C 254 312, 250 232, 274 232"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    markerEnd="url(#arrow-blue)"
                  />
                  <path
                    d="M 490 222 C 514 222, 506 146, 530 146"
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="2.2"
                    markerEnd="url(#arrow-red)"
                  />
                  <path
                    d="M 632 198 L 632 268"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2"
                    markerEnd="url(#arrow-amber)"
                  />
                  <path
                    d="M 615 96 Q 375 18, 138 94"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeDasharray="6 5"
                    markerEnd="url(#arrow-amber)"
                  />
                </svg>

                <span className="pointer-events-none absolute left-1/2 top-[34px] -translate-x-1/2 rounded-full border border-[var(--color-risk-medium-border)] bg-[var(--color-risk-medium-bg)] px-3 py-1 text-[11px] font-semibold text-[var(--color-risk-medium-text)]">
                  {detail.edgeLabels.circularReturn}
                </span>

                <span className="pointer-events-none absolute left-[128px] top-[210px] rounded-full border border-[var(--color-action-primary-border)] bg-[var(--color-action-primary-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-action-primary)]">
                  {detail.edgeLabels.referToHub}
                </span>

                <span className="pointer-events-none absolute left-[418px] top-[118px] rounded-full border border-[var(--color-risk-high-border)] bg-[var(--color-risk-high-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-risk-high-text)]">
                  {detail.edgeLabels.hubToBilling}
                </span>

                <span className="pointer-events-none absolute left-[578px] top-[222px] rounded-full border border-[var(--color-risk-medium-border)] bg-[var(--color-risk-medium-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-risk-medium-text)]">
                  {detail.edgeLabels.billingToCluster}
                </span>

                <NodeCardBox
                  nodeKey="referring_hospital"
                  tag={detail.nodes.referring_hospital.canvasTag}
                  title={detail.nodes.referring_hospital.canvasTitle}
                  meta={detail.nodes.referring_hospital.canvasMeta}
                  selected={selectedNodeKey === 'referring_hospital'}
                  className="left-[20px] top-[96px] h-[86px] w-[206px]"
                  onClick={() => onSelectNode('referring_hospital')}
                />

                <NodeCardBox
                  nodeKey="clinic_practice"
                  tag={detail.nodes.clinic_practice.canvasTag}
                  title={detail.nodes.clinic_practice.canvasTitle}
                  meta={detail.nodes.clinic_practice.canvasMeta}
                  selected={selectedNodeKey === 'clinic_practice'}
                  className="left-[20px] top-[270px] h-[84px] w-[206px]"
                  onClick={() => onSelectNode('clinic_practice')}
                />

                <NodeCardBox
                  nodeKey="dpjp_hub"
                  tag={detail.nodes.dpjp_hub.canvasTag}
                  title={detail.nodes.dpjp_hub.canvasTitle}
                  meta={detail.nodes.dpjp_hub.canvasMeta}
                  selected={selectedNodeKey === 'dpjp_hub'}
                  isHub
                  className="left-[274px] top-[174px] h-[96px] w-[216px]"
                  onClick={() => onSelectNode('dpjp_hub')}
                />

                <NodeCardBox
                  nodeKey="billing_hospital"
                  tag={detail.nodes.billing_hospital.canvasTag}
                  title={detail.nodes.billing_hospital.canvasTitle}
                  meta={detail.nodes.billing_hospital.canvasMeta}
                  selected={selectedNodeKey === 'billing_hospital'}
                  className="left-[530px] top-[96px] h-[100px] w-[210px]"
                  onClick={() => onSelectNode('billing_hospital')}
                />

                <NodeCardBox
                  nodeKey="sep_cluster"
                  tag={detail.nodes.sep_cluster.canvasTag}
                  title={detail.nodes.sep_cluster.canvasTitle}
                  meta={detail.nodes.sep_cluster.canvasMeta}
                  selected={selectedNodeKey === 'sep_cluster'}
                  className="left-[530px] top-[270px] h-[84px] w-[210px]"
                  onClick={() => onSelectNode('sep_cluster')}
                />

                <div className="pointer-events-none absolute bottom-2 left-4 rounded-full border border-[var(--color-border-default)] bg-white px-3 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
                  Garis Merah: Tagihan Anomali · Garis Putus: Rujukan Balik
                  Sirkular · Klik simpul mana saja
                </div>
              </div>
            </div>
          </div>

          <p className="mt-2.5 text-[12px] text-[var(--color-text-secondary)]">
            Klik simpul di peta untuk melihat alur rujukan, temuan spesifik, dan
            dokumen tindak lanjut di panel kanan.
          </p>
        </>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from(branchesMap.entries()).map(([branchName, list]) => (
            <div
              key={branchName}
              className="space-y-2.5 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-canvas)]/70 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-[var(--color-action-primary)]" />
                  <h3 className="text-[14px] font-bold text-[var(--color-text-primary)]">
                    {branchName}
                  </h3>
                </div>
                <span className="font-mono-code text-[11px] text-[var(--color-text-secondary)]">
                  {list.length} Kluster
                </span>
              </div>

              <div className="space-y-2">
                {list.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCluster(c.id, c.branchCode)
                      setActiveTab('graph')
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                      c.id === detail.id
                        ? 'border-[var(--color-action-primary)] bg-[var(--color-action-primary-bg)]/50'
                        : 'border-[var(--color-border-default)] bg-white hover:bg-[var(--color-bg-muted)]',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
                        {c.clusterCode} · {c.hospitalName}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        {c.escalatedClaimCount} klaim eskalasi
                      </p>
                    </div>
                    <RiskScoreBadge score={c.riskScore} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
