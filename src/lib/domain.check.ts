import assert from 'node:assert/strict'
import {
  formatDateId,
  formatIdr,
  formatIdrCompact,
  formatPercent,
  formatSlaRemaining,
} from './format'
import { formatPatientLabel, hashPatientCard, maskNik } from './privacy'
import {
  calculateCompositeRiskScore,
  evaluateEscalationTriggers,
  scoreBorAnomaly,
  scoreCircularReferral,
  scoreRepeatBilling,
  scoreTariffZScore,
} from './scoring'
import { CLAIM_STATUS_META, getRiskZone } from './status-tokens'

async function main() {
  // 1. Kasus simulasi riil Pasien #B-9021 (BLUEPRINT / Laporan BAB 2.3) -> Skor 88 (Merah)
  const composite = calculateCompositeRiskScore({
    scoreMedical: 95,
    scoreStatistical: 85,
    scoreNetwork: 80,
  })
  assert.equal(composite.riskScore, 88)
  assert.equal(composite.riskZone, 'merah')
  assert.equal(getRiskZone(39), 'hijau')
  assert.equal(getRiskZone(40), 'kuning')
  assert.equal(getRiskZone(70), 'merah')

  // 2. Fungsi skor per lapisan
  assert.equal(scoreRepeatBilling(12, false), 95)
  assert.equal(scoreRepeatBilling(12, true), 10)
  assert.equal(scoreRepeatBilling(20, false), 65)
  assert.equal(scoreTariffZScore(18_700_000, 11_200_000, 3_000_000), 90)
  assert.equal(scoreBorAnomaly(118, 35), 100)
  assert.equal(scoreCircularReferral(25), 90)

  // 3. 3 Ambang batas Trigger Loop Ibu Anita
  assert.deepEqual(
    evaluateEscalationTriggers({
      rejectedSameTypologyCount30d: 10,
      rejectedTotalAmountIdr30d: 50_000_000,
      dpjpConsecutiveRejections: 2,
    }),
    {
      triggered: true,
      triggerReason: 'cluster_frequency',
      reasons: ['cluster_frequency'],
    },
  )
  assert.equal(
    evaluateEscalationTriggers({
      rejectedSameTypologyCount30d: 11,
      rejectedTotalAmountIdr30d: 120_000_000,
      dpjpConsecutiveRejections: 5,
    }).triggerReason,
    'combined',
  )
  assert.equal(
    evaluateEscalationTriggers({
      rejectedSameTypologyCount30d: 3,
      rejectedTotalAmountIdr30d: 40_000_000,
      dpjpConsecutiveRejections: 1,
    }).triggered,
    false,
  )

  // 4. UU PDP masking & SHA-256 hash
  assert.equal(maskNik('3573011204850003'), '357301******0003')
  const h1 = await hashPatientCard('0001234567891')
  const h2 = await hashPatientCard('0001234567891')
  assert.equal(h1, h2)
  assert.match(h1, /^HASH_[0-9a-f]{12}$/)
  assert.equal(
    formatPatientLabel('Pasien #B-9021', 'L', 58),
    'Pasien #B-9021 (L, 58 thn)',
  )

  // 5. Formatter & Status tokens
  assert.equal(formatIdr(18_700_000), 'Rp 18.700.000')
  assert.equal(formatIdrCompact(48_200_000_000), 'Rp 48,2 Miliar')
  assert.equal(formatIdrCompact(420_000_000), 'Rp 420 Jt')
  assert.equal(formatDateId('2026-09-12'), '12 Sep 2026')
  assert.equal(formatPercent(85.4), '85,4%')
  assert.equal(
    formatSlaRemaining('2026-11-24T10:00:00Z', Date.parse('2026-11-23T22:00:00Z')),
    'Sisa 12 jam',
  )
  assert.equal(CLAIM_STATUS_META.balasan_rs.label, 'Balasan RS')

  console.log('domain utils check passed')
}

main()
