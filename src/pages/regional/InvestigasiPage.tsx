import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Building2, ListFilter } from 'lucide-react'
import { ClusterInspectorPanel } from '#/components/domain/investigasi/ClusterInspectorPanel'
import { ClusterStoryCards } from '#/components/domain/investigasi/ClusterStoryCards'
import { ConstellationGraphSvg } from '#/components/domain/investigasi/ConstellationGraphSvg'
import { PageHeader } from '#/components/layout/PageHeader'
import { EmptyState } from '#/components/shared/EmptyState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  clusterInvestigationQueryOptions,
  useUpdateClusterStageMutation,
} from '#/queries/clusters.queries'
import { sessionQueryOptions } from '#/queries/session.queries'
import type {
  GraphNodeKey,
  InvestigationSearchInput,
} from '#/schemas/clusters.schema'

interface InvestigasiPageProps {
  search: InvestigationSearchInput
  onSearchChange: (patch: Partial<InvestigationSearchInput>) => void
}

const PILL_TRIGGER_CLASS =
  'data-[size=default]:h-10 rounded-full border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 text-[13px] font-medium text-[var(--color-text-primary)] shadow-none'

export function InvestigasiPage({
  search,
  onSearchChange,
}: InvestigasiPageProps) {
  const { data } = useSuspenseQuery(clusterInvestigationQueryOptions(search))
  const { data: sessionUser } = useSuspenseQuery(sessionQueryOptions())
  const [selectedNodeKey, setSelectedNodeKey] =
    useState<GraphNodeKey>('dpjp_hub')
  const updateStage = useUpdateClusterStageMutation()

  const { activeCluster, clusterOptions, branches, allClusters } = data
  const totalBranchClusters = allClusters.length

  const handleClusterChange = (clusterId: string) => {
    setSelectedNodeKey('dpjp_hub')
    onSearchChange({ clusterId })
  }

  const handleBranchChange = (branchValue: string) => {
    setSelectedNodeKey('dpjp_hub')
    const nextBranch = branchValue === 'all' ? undefined : branchValue
    const firstInBranch = nextBranch
      ? allClusters.find((c) => c.branchCode === nextBranch)?.id
      : allClusters.at(0)?.id
    onSearchChange({
      branchCode: nextBranch,
      clusterId: firstInBranch,
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Investigasi & Peta Jejaring Kolusi"
        subtitle="/investigasi"
        actions={
          <>
            <Select
              value={activeCluster?.id ?? ''}
              onValueChange={handleClusterChange}
              disabled={clusterOptions.length === 0}
            >
              <SelectTrigger
                aria-label="Pilih Kluster Investigasi"
                className={PILL_TRIGGER_CLASS}
              >
                <Building2 className="size-4 text-[var(--color-text-secondary)]" />
                <SelectValue placeholder="Pilih Kluster" />
              </SelectTrigger>
              <SelectContent align="end">
                {clusterOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    Kluster: {c.clusterCode} ({c.hospitalName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={search.branchCode ?? 'all'}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger
                aria-label="Filter Kantor Cabang"
                className={PILL_TRIGGER_CLASS}
              >
                <ListFilter className="size-4 text-[var(--color-text-secondary)]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">
                  Semua KC Jatim ({totalBranchClusters} Kluster)
                </SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.branchCode} value={b.branchCode}>
                    {b.branchName} ({b.clusterCount} Kluster)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {!activeCluster ? (
        <EmptyState
          title="Belum ada kluster investigasi pada cabang ini"
          description="Pilih kantor cabang lain atau tunggu eskalasi otomatis dari hasil verifikasi cabang."
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-4">
            <ConstellationGraphSvg
              detail={activeCluster}
              allClusters={allClusters}
              selectedNodeKey={selectedNodeKey}
              onSelectNode={setSelectedNodeKey}
              onSelectCluster={(clusterId, branchCode) => {
                setSelectedNodeKey('dpjp_hub')
                onSearchChange({ clusterId, branchCode })
              }}
            />

            <ClusterStoryCards cards={activeCluster.storyCards} />
          </div>

          <ClusterInspectorPanel
            detail={activeCluster}
            selectedNodeKey={selectedNodeKey}
            auditorName={sessionUser?.name ?? 'Pengawas Wilayah'}
            isSubmitting={updateStage.isPending}
            onSubmitStage={async (input) => {
              await updateStage.mutateAsync(input)
            }}
          />
        </div>
      )}
    </div>
  )
}
