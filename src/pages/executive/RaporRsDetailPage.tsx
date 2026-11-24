import { useSuspenseQuery } from '@tanstack/react-query'
import { RaporDetailHeaderStrip } from '#/components/domain/rapor-rs-detail/RaporDetailHeaderStrip'
import { RaporDetailPilarSection } from '#/components/domain/rapor-rs-detail/RaporDetailPilarSection'
import { RaporDetailPolicyPanel } from '#/components/domain/rapor-rs-detail/RaporDetailPolicyPanel'
import { EmptyState } from '#/components/shared/EmptyState'
import {
  hospitalDetailQueryOptions,
  useSavePksRecommendationMutation,
} from '#/queries/hospitals.queries'
import { sessionQueryOptions } from '#/queries/session.queries'

interface RaporRsDetailPageProps {
  hospitalId: string
}

export function RaporRsDetailPage({ hospitalId }: RaporRsDetailPageProps) {
  const { data } = useSuspenseQuery(hospitalDetailQueryOptions(hospitalId))
  const { data: sessionUser } = useSuspenseQuery(sessionQueryOptions())
  const saveRecommendation = useSavePksRecommendationMutation(hospitalId)

  if (!data) {
    return (
      <EmptyState
        title="Rapor FKRTL mitra tidak ditemukan"
        description="Pastikan kode FKRTL valid dan berada di wilayah Kantor Cabang Anda."
      />
    )
  }

  return (
    <div className="space-y-5">
      <RaporDetailHeaderStrip
        hospital={data.hospital}
        navigation={data.navigation}
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <RaporDetailPilarSection hospital={data.hospital} />

        <RaporDetailPolicyPanel
          hospital={data.hospital}
          executiveName={sessionUser?.name ?? 'Kepala Cabang'}
          unitName={sessionUser?.unitName ?? 'KC Malang'}
          isSubmitting={saveRecommendation.isPending}
          onSaveRecommendation={async (input) => {
            await saveRecommendation.mutateAsync(input)
          }}
        />
      </div>
    </div>
  )
}
