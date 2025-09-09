
const fs = require('fs').promises
const path = require('path')

// Mock data stores (in production, these would be database calls)
const mockData = {
  fighters: [
    { id: 1, name: "Lightning Lopez", tier: "a_level_draw" },
    { id: 2, name: "Iron Mike Rivera", tier: "regional_headliner" },
    { id: 3, name: "Thunder Johnson", tier: "ppv_star" }
  ],
  
  publicStats: {
    1: { ppvBuys: 250000, gateRevenue: 6000000, attendance: 12000, tvRatings: 1.8, socialMentions: 8000, searchVolume: 75000 },
    2: { ppvBuys: 75000, gateRevenue: 1500000, attendance: 6000, tvRatings: 1.2, socialMentions: 3000, searchVolume: 25000 },
    3: { ppvBuys: 600000, gateRevenue: 15000000, attendance: 18000, tvRatings: 2.5, socialMentions: 15000, searchVolume: 120000 }
  },
  
  demand: {
    1: { totalOffers: 45, offerVolume: 180000, averageOfferPrice: 4000, uniqueBidders: 32 },
    2: { totalOffers: 28, offerVolume: 89600, averageOfferPrice: 3200, uniqueBidders: 20 },
    3: { totalOffers: 67, offerVolume: 388600, averageOfferPrice: 5800, uniqueBidders: 48 }
  },
  
  resale: {
    1: { totalResales: 12, resaleVolume: 54000, averageResalePrice: 4500, priceChange: 0.125 },
    2: { totalResales: 8, resaleVolume: 27200, averageResalePrice: 3400, priceChange: 0.063 },
    3: { totalResales: 18, resaleVolume: 108000, averageResalePrice: 6000, priceChange: 0.034 }
  },
  
  newsTags: {
    1: { tags: ['fight_announcement'], newsItems: [] },
    2: { tags: [], newsItems: [] },
    3: { tags: ['title_shot'], newsItems: [] }
  },
  
  refunds: {
    1: { totalRefunds: 2, refundVolume: 8000, refundReasons: [], hasMatchingNewsTag: false },
    2: { totalRefunds: 1, refundVolume: 3200, refundReasons: [], hasMatchingNewsTag: false },
    3: { totalRefunds: 0, refundVolume: 0, refundReasons: [], hasMatchingNewsTag: false }
  },
  
  previousFV: {
    1: 4200,
    2: 3100,
    3: 5900
  }
}

// Import valuation logic (in Node.js, we'd use require or dynamic import)
const WEIGHTS = {
  OFFER_SIGNAL: 0.4,
  RESALE_SIGNAL: 0.3,
  PUBLIC_SIGNAL: 0.3
}

const NEWS_FACTORS = {
  'fight_announcement': 1.2,
  'title_shot': 1.5,
  'comeback': 1.1,
  'injury': 0.8,
  'retirement': 0.6,
  'controversy': 0.7,
  'contract_dispute': 0.9,
  'doping_violation': 0.5
}

const TIER_MULTIPLIERS = {
  ppv_star: 2.0,
  a_level_draw: 1.5,
  regional_headliner: 1.2,
  fringe_contender: 1.0
}

function computeFV(inputs) {
  const { publicStats, demand, resale, newsTags, refunds, fighterTier, previousFV = 0 } = inputs

  // 1. Compute offer signal
  const offerSignal = computeOfferSignal(demand, previousFV)
  
  // 2. Compute resale signal
  const resaleSignal = computeResaleSignal(resale, previousFV)
  
  // 3. Compute public signal
  const publicSignal = computePublicSignal(publicStats, fighterTier)
  
  // 4. Compute news factor
  const newsFactor = computeNewsFactor(newsTags)
  
  // 5. Apply refund adjustment
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
  if (!demand || demand.totalOffers === 0) return previousFV * 0.9

  const diversityFactor = Math.min(demand.uniqueBidders / 10, 1.0)
  const volumeSignal = demand.offerVolume * diversityFactor
  const priceSignal = demand.averageOfferPrice * demand.totalOffers
  
  return Math.max(volumeSignal, priceSignal) / 100
}

function computeResaleSignal(resale, previousFV) {
  if (!resale || resale.totalResales === 0) return previousFV * 0.95

  const maxResaleMultiplier = 1.5
  const resaleMultiplier = Math.min(resale.averageResalePrice / (previousFV || 1), maxResaleMultiplier)
  const baseSignal = resale.resaleVolume * resaleMultiplier
  
  return Math.min(baseSignal / 100, previousFV * maxResaleMultiplier)
}

function computePublicSignal(publicStats, fighterTier) {
  if (!publicStats) return 0

  const expectedMetrics = getExpectedMetrics(fighterTier)
  const tierMultiplier = TIER_MULTIPLIERS[fighterTier] || 1.0

  const normalizedMetrics = {
    ppvBuys: Math.min((publicStats.ppvBuys / expectedMetrics.ppvBuys) * 100, 200),
    gateRevenue: Math.min((publicStats.gateRevenue / expectedMetrics.gateRevenue) * 100, 200),
    attendance: Math.min((publicStats.attendance / expectedMetrics.attendance) * 100, 200),
    tvRatings: Math.min((publicStats.tvRatings / expectedMetrics.tvRatings) * 100, 200),
    socialMentions: Math.min((publicStats.socialMentions / expectedMetrics.socialMentions) * 100, 200),
    searchVolume: Math.min((publicStats.searchVolume / expectedMetrics.searchVolume) * 100, 200)
  }

  const weights = { ppvBuys: 0.3, gateRevenue: 0.25, attendance: 0.2, tvRatings: 0.1, socialMentions: 0.1, searchVolume: 0.05 }
  
  return Object.entries(normalizedMetrics).reduce((sum, [metric, value]) => {
    return sum + (value * (weights[metric] || 0))
  }, 0) * tierMultiplier
}

function computeNewsFactor(newsTags) {
  if (!newsTags || !newsTags.tags || newsTags.tags.length === 0) return 1.0

  const factors = newsTags.tags.map(tag => NEWS_FACTORS[tag] || 1.0)
  
  if (factors.length === 1) return factors[0]
  
  const positiveFactor = Math.max(...factors.filter(f => f > 1.0), 1.0)
  const negativeFactor = Math.min(...factors.filter(f => f < 1.0), 1.0)
  
  if (positiveFactor > 1.0 && negativeFactor < 1.0) {
    return (positiveFactor + negativeFactor) / 2
  }
  
  return positiveFactor !== 1.0 ? positiveFactor : negativeFactor
}

function computeRefundAdjustment(refunds, newsTags) {
  if (!refunds || refunds.totalRefunds === 0) return 0
  
  if (!refunds.hasMatchingNewsTag) {
    console.log(`Refunds logged separately - no matching news context for ${refunds.totalRefunds} refunds`)
    return 0
  }

  const refundImpact = -(refunds.refundVolume / 1000)
  return Math.max(refundImpact, -50)
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

async function computeWeeklyValuations() {
  try {
    console.log('🥊 Computing Weekly Fighter Valuations...')
    
    // Get last Sunday's date for week ending
    const today = new Date()
    const lastSunday = new Date(today.setDate(today.getDate() - today.getDay()))
    const weekEnding = lastSunday.toISOString().split('T')[0]
    
    console.log(`📅 Week ending: ${weekEnding}`)
    
    const results = []
    
    // Process each fighter
    for (const fighter of mockData.fighters) {
      console.log(`\n🥊 Processing ${fighter.name} (${fighter.tier})...`)
      
      const inputs = {
        publicStats: mockData.publicStats[fighter.id],
        demand: mockData.demand[fighter.id],
        resale: mockData.resale[fighter.id],
        newsTags: mockData.newsTags[fighter.id],
        refunds: mockData.refunds[fighter.id],
        fighterTier: fighter.tier,
        previousFV: mockData.previousFV[fighter.id]
      }
      
      const valuation = computeFV(inputs)
      
      const weeklyValuation = {
        fighterId: fighter.id,
        fighterName: fighter.name,
        weekEnding,
        ...valuation,
        computedAt: new Date().toISOString()
      }
      
      results.push(weeklyValuation)
      
      console.log(`   💰 FV: $${(valuation.fightfolioValue / 100).toFixed(2)}`)
      console.log(`   📊 Components: Offer($${(valuation.components.offerSignal / 100).toFixed(2)}) + Resale($${(valuation.components.resaleSignal / 100).toFixed(2)}) + Public($${(valuation.components.publicSignal / 100).toFixed(2)})`)
      console.log(`   📰 News Factor: ${valuation.components.newsFactor.toFixed(2)}x`)
    }
    
    // Save results to JSON file (in production, save to database)
    const outputPath = path.join(__dirname, '..', 'data', `weekly_valuations_${weekEnding}.json`)
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2))
    
    console.log(`\n✅ Weekly valuations computed and saved to ${outputPath}`)
    console.log(`📊 Summary:`)
    results.forEach(r => {
      console.log(`   ${r.fighterName}: $${(r.fightfolioValue / 100).toFixed(2)}`)
    })
    
  } catch (error) {
    console.error('❌ Error computing weekly valuations:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  computeWeeklyValuations()
}

module.exports = { computeWeeklyValuations, computeFV }
