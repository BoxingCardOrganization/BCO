
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

  // Trading Ring
  async getMessages() {
    try {
      return await fetchAPI('/trading-ring/messages')
    } catch (error) {
      return mockMessages
    }
  },

  async postMessage(content) {
    try {
      return await fetchAPI('/trading-ring/messages', {
        method: 'POST',
        body: JSON.stringify({ content })
      })
    } catch (error) {
      // Mock response
      const newMessage = {
        id: Date.now(),
        author: "0x1234...5678",
        content,
        timestamp: Date.now(),
        fanTier: 2,
        score: 100
      }
      return newMessage
    }
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
