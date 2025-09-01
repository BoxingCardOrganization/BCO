
// Trading Ring scoring formula: log(1+FV) × FT × exp(-λ×ageSec) × (1+E)
// FV = Fightfolio Value, FT = Fan Tier multiplier, λ = decay constant, E = engagement

const DECAY_LAMBDA = 0.0001 // Decay rate per second
const BASE_ENGAGEMENT = 0.1 // Base engagement multiplier

export function calculateScore(fightfolioValue, fanTier, ageSeconds, engagement = 0) {
  const fvComponent = Math.log(1 + fightfolioValue)
  const tierMultiplier = getTierMultiplier(fanTier)
  const timeDecay = Math.exp(-DECAY_LAMBDA * ageSeconds)
  const engagementBonus = 1 + BASE_ENGAGEMENT + engagement
  
  return fvComponent * tierMultiplier * timeDecay * engagementBonus
}

export function getTierMultiplier(tier) {
  const multipliers = {
    1: 1.0,   // Casual
    2: 1.2,   // Analyst  
    3: 1.5,   // Historian
    4: 2.0    // Purist
  }
  return multipliers[tier] || 1.0
}

export function getTierName(tier) {
  const names = {
    1: "Casual",
    2: "Analyst", 
    3: "Historian",
    4: "Purist"
  }
  return names[tier] || "Unknown"
}

// Export the existing function that's already defined above
export { getTierMultiplier }
