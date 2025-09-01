const API_BASE = '/api'
const RPC_ENDPOINT = '/rpc'

class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    throw new APIError('Network error', 0, { originalError: error.message })
  }
}

async function rpcCall(method, params = []) {
  try {
    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new APIError(data.error.message, data.error.code, data.error.data)
    }

    return data.result
  } catch (error) {
    if (error instanceof APIError) throw error
    throw new APIError('RPC error', -1, { originalError: error.message })
  }
}

// Mock data for development
const mockFighters = [
  {
    id: 1,
    name: "Lightning Lopez",
    weight: "147 lbs",
    record: "15-2-0",
    lastFight: "2024-01-15",
    highestAttendance: 12000,
    currentCap: 6000,
    mintedCount: 2400,
    currentPrice: 4500,
    tier: "rising"
  },
  {
    id: 2,
    name: "Iron Mike Rivera",
    weight: "160 lbs",
    record: "22-1-1",
    lastFight: "2024-02-20",
    highestAttendance: 8500,
    currentCap: 4250,
    mintedCount: 3100,
    currentPrice: 3200,
    tier: "veteran"
  },
  {
    id: 3,
    name: "Thunder Johnson",
    weight: "175 lbs",
    record: "18-0-0",
    lastFight: "2024-03-10",
    highestAttendance: 15000,
    currentCap: 7500,
    mintedCount: 1800,
    currentPrice: 5800,
    tier: "prospect"
  }
]

const mockMessages = [
  {
    id: 1,
    author: "0x1234...5678",
    content: "Lightning Lopez looking strong for his next fight! 🥊",
    timestamp: Date.now() - 3600000,
    fanTier: 2,
    score: 150
  },
  {
    id: 2,
    author: "0x9876...4321",
    content: "Rivera's defense has been solid lately. Worth watching.",
    timestamp: Date.now() - 7200000,
    fanTier: 3,
    score: 120
  }
]

// Mock weekly FV data
const mockWeeklyFV = {
  1: {
    fightfolioValue: 4500,
    weekEnding: '2024-01-14',
    components: {
      offerSignal: 1800,
      resaleSignal: 1350,
      publicSignal: 1200,
      newsFactor: 1.2,
      refundAdjustment: 0
    },
    sources: {
      ppvBuys: 'https://example.com/ppv-data',
      gateRevenue: 'https://example.com/gate-data',
      attendance: 'https://example.com/attendance-data'
    }
  },
  2: {
    fightfolioValue: 3400,
    weekEnding: '2024-01-14',
    components: {
      offerSignal: 1360,
      resaleSignal: 1020,
      publicSignal: 900,
      newsFactor: 1.0,
      refundAdjustment: 0
    },
    sources: {}
  },
  3: {
    fightfolioValue: 6200,
    weekEnding: '2024-01-14',
    components: {
      offerSignal: 2480,
      resaleSignal: 1860,
      publicSignal: 1550,
      newsFactor: 1.5,
      refundAdjustment: 0
    },
    sources: {
      ppvBuys: 'https://example.com/ppv-data-3',
      attendance: 'https://example.com/attendance-data-3'
    }
  }
}

const mockFVHistory = {
  1: [
    { weekEnding: '2023-11-19', fightfolioValue: 3200 },
    { weekEnding: '2023-11-26', fightfolioValue: 3400 },
    { weekEnding: '2023-12-03', fightfolioValue: 3800 },
    { weekEnding: '2023-12-10', fightfolioValue: 4100 },
    { weekEnding: '2023-12-17', fightfolioValue: 3900 },
    { weekEnding: '2023-12-24', fightfolioValue: 4200 },
    { weekEnding: '2024-01-07', fightfolioValue: 4300 },
    { weekEnding: '2024-01-14', fightfolioValue: 4500 }
  ],
  2: [
    { weekEnding: '2023-11-19', fightfolioValue: 2800 },
    { weekEnding: '2023-11-26', fightfolioValue: 3000 },
    { weekEnding: '2023-12-03', fightfolioValue: 3100 },
    { weekEnding: '2023-12-10', fightfolioValue: 3200 },
    { weekEnding: '2023-12-17', fightfolioValue: 3300 },
    { weekEnding: '2023-12-24', fightfolioValue: 3250 },
    { weekEnding: '2024-01-07', fightfolioValue: 3350 },
    { weekEnding: '2024-01-14', fightfolioValue: 3400 }
  ],
  3: [
    { weekEnding: '2023-11-19', fightfolioValue: 5200 },
    { weekEnding: '2023-11-26', fightfolioValue: 5400 },
    { weekEnding: '2023-12-03', fightfolioValue: 5600 },
    { weekEnding: '2023-12-10', fightfolioValue: 5800 },
    { weekEnding: '2023-12-17', fightfolioValue: 5500 },
    { weekEnding: '2023-12-24', fightfolioValue: 5900 },
    { weekEnding: '2024-01-07', fightfolioValue: 6000 },
    { weekEnding: '2024-01-14', fightfolioValue: 6200 }
  ]
}


// API functions
export const api = {
  // Health check
  async health() {
    try {
      return await fetchAPI('/health')
    } catch (error) {
      return { ok: true } // Mock fallback
    }
  },

  // Fighter data
  async getFighters() {
    try {
      return await fetchAPI('/fighters')
    } catch (error) {
      return mockFighters // Mock fallback
    }
  },

  async getFighter(id) {
    try {
      return await fetchAPI(`/fighters/${id}`)
    } catch (error) {
      return mockFighters.find(f => f.id === parseInt(id)) || null
    }
  },

  // Trading Ring messages
  async getMessages() {
    return this.request('/messages', {}, mockMessages)
  },

  async postMessage(messageData) {
    const newMessage = {
      id: Date.now(),
      content: messageData.content,
      author: "0x1234...5678", // Mock wallet address
      fanTier: messageData.fanTier,
      fightfolioValue: messageData.fightfolioValue,
      score: messageData.score,
      timestamp: Date.now()
    }
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData)
    }, newMessage)
  },

  // Fightfolio Value endpoints
  async getCurrentFV(fighterId) {
    return this.request(`/fighters/${fighterId}/fv`, {}, mockWeeklyFV[fighterId])
  },

  async getFVHistory(fighterId, weeks = 8) {
    return this.request(`/fighters/${fighterId}/fv/history?weeks=${weeks}`, {}, mockFVHistory[fighterId] || [])
  },

  async getUserProfile() {
    return this.request('/user/profile', {}, {
      fightfolioValue: 4200,
      fanTier: 2,
      address: "0x1234...5678"
    })
  },

  // Weekly Valuation Admin endpoints
  async getWeeklyValuation(fighterId, weekEnding) {
    return this.request(`/admin/valuations/${fighterId}/${weekEnding}`, {}, null)
  },

  async saveWeeklyValuation(valuation) {
    return this.request('/admin/valuations', {
      method: 'POST',
      body: JSON.stringify(valuation)
    }, { success: true })
  },

  async getFighterDemand(fighterId, weekEnding) {
    return this.request(`/fighters/${fighterId}/demand/${weekEnding}`, {}, {
      totalOffers: Math.floor(Math.random() * 50) + 20,
      offerVolume: Math.floor(Math.random() * 200000) + 100000,
      averageOfferPrice: Math.floor(Math.random() * 2000) + 3000,
      uniqueBidders: Math.floor(Math.random() * 30) + 15
    })
  },

  async getFighterResale(fighterId, weekEnding) {
    return this.request(`/fighters/${fighterId}/resale/${weekEnding}`, {}, {
      totalResales: Math.floor(Math.random() * 20) + 5,
      resaleVolume: Math.floor(Math.random() * 100000) + 50000,
      averageResalePrice: Math.floor(Math.random() * 1000) + 3500,
      priceChange: (Math.random() - 0.5) * 0.2
    })
  },

  async getFighterRefunds(fighterId, weekEnding) {
    return this.request(`/fighters/${fighterId}/refunds/${weekEnding}`, {}, {
      totalRefunds: Math.floor(Math.random() * 5),
      refundVolume: Math.floor(Math.random() * 20000),
      refundReasons: [],
      hasMatchingNewsTag: false
    })
  },

  async getPreviousFV(fighterId, weekEnding) {
    const history = mockFVHistory[fighterId]
    if (!history || history.length === 0) return 0

    // Find the week before the given week
    const weekIndex = history.findIndex(w => w.weekEnding === weekEnding)
    if (weekIndex > 0) {
      return history[weekIndex - 1].fightfolioValue
    }
    return history[history.length - 1]?.fightfolioValue || 0
  },


  // Wallet
  async getBalance(address) {
    try {
      return await fetchAPI(`/wallet/${address}/balance`)
    } catch (error) {
      return { balance: "1000.00", currency: "USD" }
    }
  },

  // Blockchain calls
  async getAccount() {
    try {
      return await rpcCall('eth_accounts')
    } catch (error) {
      return ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"] // Mock
    }
  }
}

export { APIError }