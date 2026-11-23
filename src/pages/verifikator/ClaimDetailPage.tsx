import { useEffect, useRef } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ClaimConfirmationStatusSection } from '#/components/domain/claim-detail/ClaimConfirmationStatusSection'
import { ClaimDecisionPanelSection } from '#/components/domain/claim-detail/ClaimDecisionPanelSection'
import { ClaimDetailHeaderSection } from '#/components/domain/claim-detail/ClaimDetailHeaderSection'
import { ClaimSummarySection } from '#/components/domain/claim-detail/ClaimSummarySection'
import { ClaimVisualAuditSection } from '#/components/domain/claim-detail/ClaimVisualAuditSection'
import {
  claimDetailQueryOptions,
  useGenerateClaimAiMutation,
  useRecordHospitalResponseMutation,
  useSubmitClaimDecisionMutation,
} from '#/queries/claim-detail.queries'

interface ClaimDetailPageProps {
  claimId: string
  verifikatorName: string
}

export function ClaimDetailPage({
  claimId,
  verifikatorName,
}: ClaimDetailPageProps) {
  const { data } = useSuspenseQuery(claimDetailQueryOptions(claimId))
  const submitDecision = useSubmitClaimDecisionMutation(claimId)
  const recordResponse = useRecordHospitalResponseMutation(claimId)
  const generateAi = useGenerateClaimAiMutation(claimId)
  const autoTriggeredRef = useRef<Set<string>>(new Set())

  const claim = data?.claim

  // Generate 1x saat berkas pertama kali dibuka lalu simpan permanen ke D1 (hemat token)
  useEffect(() => {
    if (!claim) return
    if (
      (!claim.aiNarrativeCache || !claim.aiDraftCache) &&
      !autoTriggeredRef.current.has(claim.id)
    ) {
      autoTriggeredRef.current.add(claim.id)
      generateAi.mutate({ claimId: claim.id, mode: 'all', force: false })
    }
  }, [claim?.id, claim?.aiNarrativeCache, claim?.aiDraftCache])

  if (!data) {
    return null
  }

  const { auditLogs, navigation } = data

  return (
    <div className="space-y-5">
      <ClaimDetailHeaderSection
        claimId={data.claim.id}
        noSep={data.claim.noSep}
        navigation={navigation}
      />

      <ClaimSummarySection claim={data.claim} />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <ClaimConfirmationStatusSection
            claim={data.claim}
            verifikatorName={verifikatorName}
            isRecording={recordResponse.isPending}
            onRecordResponse={async (responseNote) => {
              await recordResponse.mutateAsync({
                claimId: data.claim.id,
                responseNote,
              })
            }}
          />

          <ClaimVisualAuditSection
            claim={data.claim}
            auditLogs={auditLogs}
            isGeneratingNarrative={generateAi.isPending}
            onGenerateNarrative={() => {
              void generateAi.mutate({
                claimId: data.claim.id,
                mode: 'all',
                force: true,
              })
            }}
          />
        </div>

        <div className="xl:col-span-4 xl:sticky xl:top-5">
          <ClaimDecisionPanelSection
            claim={data.claim}
            isSubmitting={submitDecision.isPending}
            isGeneratingDraft={generateAi.isPending}
            onSubmitDecision={async (input) => {
              await submitDecision.mutateAsync(input)
            }}
            onGenerateDraft={async (requiredDocs) => {
              await generateAi.mutateAsync({
                claimId: data.claim.id,
                mode: 'all',
                requiredDocs,
                force: true,
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}
