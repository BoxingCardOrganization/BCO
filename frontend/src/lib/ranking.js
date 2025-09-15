// Client-side ranking utilities for Trading Ring
// Rank combines Fightfolio value, tier weight, time decay, and engagement boost.

export function rankMessage(msg, now = Date.now()) {
  // 1) Base via log(1+FV)
  const fv = Math.max(0, msg?.fightfolioValue || 0);
  const base = Math.log1p(fv);

  // 2) Tier weights: 1=Casual, 2=Analyst, 3=Historian, 4=Purist
  const tier = Number(msg?.fanTier) || 1;
  const tierW = { 1: 1.0, 2: 1.2, 3: 1.5, 4: 2.0 }[tier] || 1.0;

  // 3) Time decay with tier-specific half-lives (hours): 1->3h, 2->6h, 3->12h, 4->24h
  const halfLives = { 1: 3, 2: 6, 3: 12, 4: 24 };
  const ts = Number(msg?.timestamp || now);
  const hrs = Math.max(0, (now - ts) / (1000 * 60 * 60));
  const hl = halfLives[tier] ?? 6;
  const decay = Math.pow(0.5, hrs / hl);

  // 4) Engagement boost: likes + 2*replies, capped at +100%
  const likes = (msg?.engagement?.likes ?? msg?.likes ?? 0) | 0;
  const replies = (msg?.engagement?.replies ?? msg?.replies ?? 0) | 0;
  const eng = Math.max(0, likes + 2 * replies);
  const engBoost = 1 + Math.min(1, eng / 20);

  return base * tierW * decay * engBoost;
}

export function computeTrending(messages, now = Date.now()) {
  // Trending posts in the last 24 hours by engagement (likes + 2*replies), tie-break by recency
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const recent = (messages || []).filter((m) => (m?.timestamp || now) >= dayAgo);
  return recent
    .map((m) => {
      const likes = (m?.engagement?.likes ?? m?.likes ?? 0) | 0;
      const replies = (m?.engagement?.replies ?? m?.replies ?? 0) | 0;
      return { ...m, _trendScore: Math.max(0, likes + 2 * replies) };
    })
    .sort((a, b) => b._trendScore - a._trendScore || (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 5);
}

