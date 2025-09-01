
// Fighter valuation data types

export const FighterPublicStats = {
  fighterId: 0,
  weekEnding: '',
  ppvBuys: 0,
  gateRevenue: 0,
  attendance: 0,
  tvRatings: 0,
  socialMentions: 0,
  searchVolume: 0,
  sources: {
    ppvBuys: '',
    gateRevenue: '',
    attendance: '',
    tvRatings: '',
    socialMentions: '',
    searchVolume: ''
  }
}

export const FighterDemand = {
  fighterId: 0,
  weekEnding: '',
  totalOffers: 0,
  offerVolume: 0,
  averageOfferPrice: 0,
  uniqueBidders: 0
}

export const FighterResale = {
  fighterId: 0,
  weekEnding: '',
  totalResales: 0,
  resaleVolume: 0,
  averageResalePrice: 0,
  highestResalePrice: 0,
  priceChange: 0
}

export const FighterNewsTags = {
  fighterId: 0,
  weekEnding: '',
  tags: [], // ['fight_announcement', 'injury', 'controversy', 'retirement', 'comeback']
  newsItems: [
    {
      title: '',
      url: '',
      date: '',
      source: '',
      tags: []
    }
  ]
}

export const FighterRefunds = {
  fighterId: 0,
  weekEnding: '',
  totalRefunds: 0,
  refundVolume: 0,
  refundReasons: [],
  hasMatchingNewsTag: false
}

export const WeeklyValuation = {
  fighterId: 0,
  weekEnding: '',
  fightfolioValue: 0,
  components: {
    offerSignal: 0,
    resaleSignal: 0,
    publicSignal: 0,
    newsFactor: 1.0,
    refundAdjustment: 0
  },
  sources: {},
  publishedAt: '',
  publishedBy: ''
}

export const FighterTiers = {
  PPV_STAR: 'ppv_star',
  A_LEVEL_DRAW: 'a_level_draw', 
  REGIONAL_HEADLINER: 'regional_headliner',
  FRINGE_CONTENDER: 'fringe_contender'
}

export const NewsTags = {
  FIGHT_ANNOUNCEMENT: 'fight_announcement',
  INJURY: 'injury',
  CONTROVERSY: 'controversy',
  RETIREMENT: 'retirement',
  COMEBACK: 'comeback',
  TITLE_SHOT: 'title_shot',
  CONTRACT_DISPUTE: 'contract_dispute',
  DOPING_VIOLATION: 'doping_violation'
}
