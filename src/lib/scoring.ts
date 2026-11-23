import { getRiskZone, type RiskZone } from './status-tokens'

const WEIGHT_MEDICAL = 0.4
const WEIGHT_STATISTICAL = 0.35
const WEIGHT_NETWORK = 0.25

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function scoreRepeatBilling(
  daysSincePrevious: number | null,
  hasEmergencyIndication: boolean,
): number {
  if (daysSincePrevious === null || hasEmergencyIndication) return 10
  if (daysSincePrevious < 14) return 95
  if (daysSincePrevious < 30) return 65
  return 10
}

export function scoreTariffZScore(
  claimedTariffIdr: number,
  peerMeanIdr: number,
  peerStdDevIdr: number,
): number {
  if (peerStdDevIdr <= 0) return 15
  const z = (claimedTariffIdr - peerMeanIdr) / peerStdDevIdr
  if (z > 2.0) return 90
  if (z > 1.0) return 50
  return 15
}

export function scoreBorAnomaly(
  borPercent: number,
  outpatientToInpatientPct: number,
): number {
  let score = borPercent > 100 ? 95 : borPercent > 85 ? 50 : 15
  if (outpatientToInpatientPct > 30) score += 25
  return clampScore(score)
}

export function scoreCircularReferral(circularRatioPct: number): number {
  if (circularRatioPct > 20) return 90
  if (circularRatioPct > 5) return 55
  return 10
}

export interface CompositeScoreResult {
  scoreMedical: number
  scoreStatistical: number
  scoreNetwork: number
  riskScore: number
  riskZone: RiskZone
}

export function calculateCompositeRiskScore(params: {
  scoreMedical: number
  scoreStatistical: number
  scoreNetwork: number
}): CompositeScoreResult {
  const scoreMedical = clampScore(params.scoreMedical)
  const scoreStatistical = clampScore(params.scoreStatistical)
  const scoreNetwork = clampScore(params.scoreNetwork)

  const riskScore = clampScore(
    WEIGHT_MEDICAL * scoreMedical +
      WEIGHT_STATISTICAL * scoreStatistical +
      WEIGHT_NETWORK * scoreNetwork,
  )

  return {
    scoreMedical,
    scoreStatistical,
    scoreNetwork,
    riskScore,
    riskZone: getRiskZone(riskScore),
  }
}

export const ESCALATION_THRESHOLDS = {
  clusterRejectionCount: 10,
  financialExposureIdr: 100_000_000,
  dpjpConsecutiveRejections: 5,
} as const

export type TriggerReason =
  | 'cluster_frequency'
  | 'financial_exposure'
  | 'dpjp_outlier'
  | 'combined'

export interface EscalationEvaluation {
  triggered: boolean
  triggerReason: TriggerReason | null
  reasons: Exclude<TriggerReason, 'combined'>[]
}

export function evaluateEscalationTriggers(metrics: {
  rejectedSameTypologyCount30d: number
  rejectedTotalAmountIdr30d: number
  dpjpConsecutiveRejections: number
}): EscalationEvaluation {
  const reasons: Exclude<TriggerReason, 'combined'>[] = []

  if (
    metrics.rejectedSameTypologyCount30d >=
    ESCALATION_THRESHOLDS.clusterRejectionCount
  ) {
    reasons.push('cluster_frequency')
  }
  if (
    metrics.rejectedTotalAmountIdr30d >=
    ESCALATION_THRESHOLDS.financialExposureIdr
  ) {
    reasons.push('financial_exposure')
  }
  if (
    metrics.dpjpConsecutiveRejections >=
    ESCALATION_THRESHOLDS.dpjpConsecutiveRejections
  ) {
    reasons.push('dpjp_outlier')
  }

  return {
    triggered: reasons.length > 0,
    triggerReason:
      reasons.length > 1 ? 'combined' : (reasons[0] ?? null),
    reasons,
  }
}
