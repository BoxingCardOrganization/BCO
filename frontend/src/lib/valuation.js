
import { NewsTags } from './types.js'

// Valuation weights and constants
const WEIGHTS = {
  OFFER_SIGNAL: 0.4,
  RESALE_SIGNAL: 0.3,
  PUBLIC_SIGNAL: 0.3
}

const NEWS_FACTORS = {
  [NewsTags.FIGHT_ANNOUNCEMENT]: 1.2,
  [NewsTags.TITLE_SHOT]: 1.5,
  [NewsTags.COMEBACK]: 1.1,
  [NewsTags.INJURY]: 0.8,
  [NewsTags.RETIREMENT]: 0.6,
  [NewsTags.CONTROVERSY]: 0.7,
  [NewsTags.CONTRACT_DISPUTE]: 0.9,
  [NewsTags.DOPING_VIOLATION]: 0.5
}

const TIER_MULTIPLIERS = {
  ppv_star: 2.0,
  a_level_draw: 1.5,
  regional_headliner: 1.2,
  fringe_contender: 1.0
}

/**
 * Compute Fighter Value (FV) based on offer activity, resale data, and public signals
 * Formula: FV = (offerSignal * 0.4 + resaleSignal * 0.3 + publicSignal * 0.3) * newsFactor * tierMultiplier
 */
export function computeFV(inputs) {
  const {
    publicStats,
    demand,
    resale,
    newsTags,
    refunds,
    fighterTier,
    previousFV = 0
  } = inputs

  // 1. Compute offer signal (offer-heavy weighting)
  const offerSignal = computeOfferSignal(demand, previousFV)

  // 2. Compute resale signal (bounded to prevent speculation)
  const resaleSignal = computeResaleSignal(resale, previousFV)

  // 3. Compute public signal (normalized metrics)
  const publicSignal = computePublicSignal(publicStats, fighterTier)

  // 4. Compute news factor
  const newsFactor = computeNewsFactor(newsTags)

  // 5. Apply refund adjustment if matching news tag exists
  const refundAdjustment = computeRefundAdjustment(refunds, newsTags)

  // 6. Get tier multiplier
  const tierMultiplier = TIER_MULTIPLIERS[fighterTier] || 1.0

  // Base FV calculation
  const baseFV = (
    offerSignal * WEIGHTS.OFFER_SIGNAL +
    resaleSignal * WEIGHTS.RESALE_SIGNAL +
    publicSignal * WEIGHTS.PUBLIC_SIGNAL
  ) * newsFactor * tierMultiplier

  // Apply refund adjustment
  const adjustedFV = Math.max(0, baseFV + refundAdjustment)

  return {
    fightfolioValue: Math.round(adjustedFV),
    components: {
      offerSignal: Math.round(offerSignal),
      resaleSignal: Math.round(resaleSignal), 
      publicSignal: Math.round(publicSignal),
      newsFactor: newsFactor,
      refundAdjustment: Math.round(refundAdjustment)
    }
  }
}

function computeOfferSignal(demand, previousFV) {
  if (!demand || demand.totalOffers === 0) return previousFV * 0.9 // Small decay if no offers

  // Offer volume weighted by unique bidders (prevents manipulation)
  const diversityFactor = Math.min(demand.uniqueBidders / 10, 1.0)
  const volumeSignal = demand.offerVolume * diversityFactor
  
  // Price signal relative to current average
  const priceSignal = demand.averageOfferPrice * demand.totalOffers
  
  return Math.max(volumeSignal, priceSignal) / 100 // Scale to reasonable range
}

function computeResaleSignal(resale, previousFV) {
  if (!resale || resale.totalResales === 0) return previousFV * 0.95 // Small decay if no resales

  // Cap resale impact to prevent speculation
  const maxResaleMultiplier = 1.5
  const resaleMultiplier = Math.min(
    resale.averageResalePrice / (previousFV || 1),
    maxResaleMultiplier
  )

  // Volume-weighted resale signal
  const baseSignal = resale.resaleVolume * resaleMultiplier
  
  return Math.min(baseSignal / 100, previousFV * maxResaleMultiplier)
}

function computePublicSignal(publicStats, fighterTier) {
  if (!publicStats) return 0

  // Normalize each metric (0-100 scale based on tier expectations)
  const tierMultiplier = TIER_MULTIPLIERS[fighterTier] || 1.0
  const expectedMetrics = getExpectedMetrics(fighterTier)

  const normalizedMetrics = {
    ppvBuys: Math.min((publicStats.ppvBuys / expectedMetrics.ppvBuys) * 100, 200),
    gateRevenue: Math.min((publicStats.gateRevenue / expectedMetrics.gateRevenue) * 100, 200),
    attendance: Math.min((publicStats.attendance / expectedMetrics.attendance) * 100, 200),
    tvRatings: Math.min((publicStats.tvRatings / expectedMetrics.tvRatings) * 100, 200),
    socialMentions: Math.min((publicStats.socialMentions / expectedMetrics.socialMentions) * 100, 200),
    searchVolume: Math.min((publicStats.searchVolume / expectedMetrics.searchVolume) * 100, 200)
  }

  // Weighted average of normalized metrics
  const weights = { ppvBuys: 0.3, gateRevenue: 0.25, attendance: 0.2, tvRatings: 0.1, socialMentions: 0.1, searchVolume: 0.05 }
  
  return Object.entries(normalizedMetrics).reduce((sum, [metric, value]) => {
    return sum + (value * (weights[metric] || 0))
  }, 0) * tierMultiplier
}

function computeNewsFactor(newsTags) {
  if (!newsTags || !newsTags.tags || newsTags.tags.length === 0) return 1.0

  // Apply strongest news factor (positive or negative)
  const factors = newsTags.tags.map(tag => NEWS_FACTORS[tag] || 1.0)
  
  // If multiple news items, take weighted average favoring recent/significant news
  if (factors.length === 1) return factors[0]
  
  const positiveFactor = Math.max(...factors.filter(f => f > 1.0), 1.0)
  const negativeFactor = Math.min(...factors.filter(f => f < 1.0), 1.0)
  
  // If both positive and negative news, they partially offset
  if (positiveFactor > 1.0 && negativeFactor < 1.0) {
    return (positiveFactor + negativeFactor) / 2
  }
  
  return positiveFactor !== 1.0 ? positiveFactor : negativeFactor
}

function computeRefundAdjustment(refunds, newsTags) {
  if (!refunds || refunds.totalRefunds === 0) return 0
  
  // Only apply refund impact if matching news tag exists
  if (!refunds.hasMatchingNewsTag) {
    console.log(`Refunds logged separately - no matching news context for ${refunds.totalRefunds} refunds`)
    return 0
  }

  // Negative adjustment based on refund volume and reasons
  const refundImpact = -(refunds.refundVolume / 1000) // Scale impact
  return Math.max(refundImpact, -50) // Cap maximum negative impact
}

function getExpectedMetrics(fighterTier) {
  const baselines = {
    ppv_star: { ppvBuys: 500000, gateRevenue: 10000000, attendance: 15000, tvRatings: 2.0, socialMentions: 10000, searchVolume: 100000 },
    a_level_draw: { ppvBuys: 200000, gateRevenue: 5000000, attendance: 10000, tvRatings: 1.5, socialMentions: 5000, searchVolume: 50000 },
    regional_headliner: { ppvBuys: 50000, gateRevenue: 1000000, attendance: 5000, tvRatings: 1.0, socialMentions: 2000, searchVolume: 20000 },
    fringe_contender: { ppvBuys: 10000, gateRevenue: 500000, attendance: 2000, tvRatings: 0.5, socialMentions: 1000, searchVolume: 10000 }
  }
  
  return baselines[fighterTier] || baselines.fringe_contender
}

export { NEWS_FACTORS, TIER_MULTIPLIERS, NewsTags }
