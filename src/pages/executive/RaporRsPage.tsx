import { useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { RowSelectionState } from '@tanstack/react-table'
import { Download, FileText } from 'lucide-react'
import { RaporRsFilterSection } from '#/components/domain/rapor-rs/RaporRsFilterSection'
import { RaporRsTableSection } from '#/components/domain/rapor-rs/RaporRsTableSection'
import {
  exportMatriksRsCsv,
  printBundelRapatPksHtml,
} from '#/components/domain/rapor-rs/rapor-rs.utils'
import { PageHeader } from '#/components/layout/PageHeader'
import { ConfirmActionDialog } from '#/components/shared/ConfirmActionDialog'
import { Button } from '#/components/ui/button'
import {
  hospitalsScorecardQueryOptions,
  useBulkHospitalPolicyMutation,
} from '#/queries/hospitals.queries'
import { sessionQueryOptions } from '#/queries/session.queries'
import type {
  HospitalScorecardItem,
  HospitalsFilterInput,
} from '#/schemas/hospitals.schema'

interface RaporRsPageProps {
  filters: HospitalsFilterInput
  onFiltersChange: (patch: Partial<HospitalsFilterInput>) => void
  onResetFilters: () => void
}

export function RaporRsPage({
  filters,
  onFiltersChange,
  onResetFilters,
}: RaporRsPageProps) {
  const router = useRouter()
  const { data } = useSuspenseQuery(hospitalsScorecardQueryOptions(filters))
  const { data: sessionUser } = useSuspenseQuery(sessionQueryOptions())
  const [selectedIds, setSelectedIds] = useState<RowSelectionState>({})
  const [confirmMode, setConfirmMode] = useState<
    'pembinaan' | 'diperpanjang' | null
  >(null)

  const bulkMutation = useBulkHospitalPolicyMutation()
  const { items, pagination, summary } = data

  const selectedHospitals = useMemo(
    () => items.filter((item) => Boolean(selectedIds[item.id])),
    [items, selectedIds],
  )

  const hasActiveFilters =
    Boolean(filters.pksStatus) ||
    Boolean(filters.facilityType) ||
    Boolean(filters.search) ||
    filters.sort !== 'score_asc'

  const updateFilterAndClear = (patch: Partial<HospitalsFilterInput>) => {
    setSelectedIds({})
    onFiltersChange({ ...patch, page: patch.page ?? 1 })
  }

  const handleInspect = (item: HospitalScorecardItem) => {
    void router.navigate({
      to: '/rapor-rs/$hospitalId',
      params: { hospitalId: item.id },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Rapor Kepatuhan RS Mitra (FKRTL)"
        subtitle={`${summary.totalCount} FKRTL mitra ${sessionUser?.unitName ?? 'KC Malang'} · Rata-rata skor kepatuhan ${summary.avgComplianceScore}/100 · ${summary.evaluasiPksCount} RS memerlukan evaluasi kontrak PKS atau pembinaan.`}
        actions={
          <>
            <Button
              type="button"
              variant="outlinePill"
              onClick={() => exportMatriksRsCsv(items, filters.tab)}
              className="h-10 px-4 text-[13px] font-medium"
            >
              <Download
                className="size-4 text-[var(--color-text-secondary)]"
                aria-hidden="true"
              />
              <span>Unduh Matriks RS (.CSV)</span>
            </Button>
            <Button
              type="button"
              disabled={items.length === 0}
              onClick={() =>
                printBundelRapatPksHtml({
                  items,
                  summary,
                  unitName: sessionUser?.unitName ?? 'KC Malang',
                  executiveName: sessionUser?.name ?? 'Kepala Cabang',
                })
              }
              className="h-10 rounded-full bg-[var(--color-action-primary)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--color-action-primary-hover)]"
            >
              <FileText className="size-4" aria-hidden="true" />
              <span>Cetak Bundel Rapat PKS</span>
            </Button>
          </>
        }
      />

      <RaporRsFilterSection
        filters={filters}
        totalCount={summary.totalCount}
        hasActiveFilters={hasActiveFilters}
        onFiltersChange={updateFilterAndClear}
        onReset={() => {
          setSelectedIds({})
          onResetFilters()
        }}
      />

      <RaporRsTableSection
        items={items}
        pagination={pagination}
        summary={summary}
        activeTab={filters.tab}
        selectedIds={selectedIds}
        selectedCount={selectedHospitals.length}
        isBulkPending={bulkMutation.isPending}
        onSelectedIdsChange={setSelectedIds}
        onTabChange={(tab) => updateFilterAndClear({ tab })}
        onPageChange={(page) => onFiltersChange({ page })}
        onOpenBulkPembinaan={() => setConfirmMode('pembinaan')}
        onOpenBulkPerpanjang={() => setConfirmMode('diperpanjang')}
        onInspect={handleInspect}
      />

      <ConfirmActionDialog
        open={confirmMode !== null}
        onOpenChange={(open) => !open && setConfirmMode(null)}
        tone={confirmMode === 'pembinaan' ? 'warning' : 'primary'}
        title={
          confirmMode === 'pembinaan'
            ? `Tetapkan Pembinaan untuk ${selectedHospitals.length} FKRTL?`
            : `Perpanjang PKS untuk ${selectedHospitals.length} FKRTL Terpilih?`
        }
        summary={selectedHospitals.map((h) => h.name).join(', ')}
        effects={[
          confirmMode === 'pembinaan'
            ? 'Status kontrak PKS FKRTL terpilih diperbarui menjadi Pembinaan.'
            : 'Status kontrak PKS FKRTL terpilih diperbarui menjadi Perpanjang PKS.',
          'Keputusan massal dicatat permanen ke Audit Log.',
        ]}
        confirmLabel={
          confirmMode === 'pembinaan'
            ? 'Ya, Tetapkan Pembinaan'
            : 'Ya, Perpanjang PKS'
        }
        requireNote
        defaultNote={
          confirmMode === 'pembinaan'
            ? 'Surat pembinaan triwulan diterbitkan untuk perbaikan akurasi koding.'
            : 'FKRTL memenuhi standar kepatuhan Grade A untuk perpanjangan PKS 2027.'
        }
        isPending={bulkMutation.isPending}
        onConfirm={async (note) => {
          if (!confirmMode) return
          await bulkMutation.mutateAsync({
            hospitalIds: selectedHospitals.map((h) => h.id),
            action: confirmMode,
            note,
          })
          setSelectedIds({})
          setConfirmMode(null)
        }}
      />
    </div>
  )
}
