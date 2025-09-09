// src/lib/scoring.js
// Trading Ring scoring formula: log(1+FV) × FT × exp(-λ×ageSec) × (1+E)
// FV = Fightfolio Value, FT = Fan Tier multiplier, λ = decay constant, E = engagement

export const DEFAULT_DECAY_LAMBDA = 0.0001; // per second

// Accept tier as number (1..4) or string ("Casual","Analyst","Historian","Purist")
export function getTierMultiplier(tier) {
  const multipliers = { 1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0 };

  let key = tier;
  if (typeof tier === "string") {
    const t = tier.trim().toLowerCase();
    if (t.startsWith("cas")) key = 1;
    else if (t.startsWith("ana")) key = 2;
    else if (t.startsWith("his")) key = 3;
    else if (t.startsWith("pur")) key = 4;
  }

  const m = multipliers[key];
  return typeof m === "number" ? m : 1.0;
}

export function getTierName(tier) {
  const names = { 1: "Casual", 2: "Analyst", 3: "Historian", 4: "Purist" };

  if (typeof tier === "string") {
    // Normalize common user input back to canonical names
    const t = tier.trim().toLowerCase();
    if (t.startsWith("cas")) return "Casual";
    if (t.startsWith("ana")) return "Analyst";
    if (t.startsWith("his")) return "Historian";
    if (t.startsWith("pur")) return "Purist";
  }

  return names[tier] || "Unknown";
}

// Main score function (matches plan: no baseline engagement bump)
export function calculateScore(
  fightfolioValue,
  fanTier,
  ageSeconds,
  engagement = 0,
  lambda = DEFAULT_DECAY_LAMBDA
) {
  const FV = Math.max(0, Number(fightfolioValue) || 0);
  const age = Math.max(0, Number(ageSeconds) || 0);
  const E = Math.max(0, Number(engagement) || 0);
  const FT = getTierMultiplier(fanTier);

  const base = Math.log(1 + FV);
  const decay = Math.exp(-lambda * age);
  return base * FT * decay * (1 + E);
}

// Clamp-like weight helper for visibility logic
export function tierWeight(tier){
  const w = getTierMultiplier(tier)
  return Math.min(2.0, Math.max(1.0, w))
}

// Future hook to normalize scores for UI
export function visibleRank(score){
  return Number(score) || 0
}
