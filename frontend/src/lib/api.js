const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || '/api'
const RPC_ENDPOINT = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RPC_BASE) || '/rpc'
import { isMock, isMockOverride } from './devtools'
const MOCK = (isMock() || isMockOverride())

import fightersJSON from '../mock/fighters.json'
import fighterProfilesJSON from '../mock/fighterProfiles.json'
import messagesJSON from '../mock/messages.json'
import tradesJSON from '../mock/trades.json'
import trendingJSON from '../mock/trending.json'
import systemJSON from '../mock/system.json'

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

// Mock fighters adapted from file
const mockFighters = Array.isArray(fightersJSON) ? fightersJSON.map(f => ({
  id: f.id || f.fighterId,
  name: f.fighterName || f.name || 'Unknown',
  fighterTier: f.tier || 'Fringe Contender',
  valuation: Number(f.fvNow || 0),
  prevValuation: Number((f.fvNow || 0) - (f.deltaFV || 0)),
  deltaFV: Number(f.deltaFV || 0),
  titles: Array.isArray(f.titles) ? f.titles : [],
  stats: {},
})) : []

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


// Seeded MOCK messages from file
const now = Date.now()
function parseMaybeNow(s){
  if (typeof s !== 'string') return s
  if (s.startsWith('{{now')) {
    const m = s.match(/\{\{now-([0-9]+)([mh])\}\}/)
    if (m){
      const n = Number(m[1]||0)
      const unit = m[2]
      const ms = unit === 'h' ? n*3600000 : n*60000
      return now - ms
    }
  }
  if (s === '{{now}}') return now
  const d = Date.parse(s)
  return isNaN(d) ? now : d
}
const MOCK_MESSAGES = Array.isArray(messagesJSON) ? messagesJSON.map(m => ({
  ...m,
  timestamp: parseMaybeNow(m.timestamp),
})) : []

// In-memory reaction store for MOCK and safe fallbacks
const __reactionStore = new Map() // id -> { likes, dislikes }

function ensureEngagementShape(msg){
  const e = msg.engagement || {}
  const store = __reactionStore.get(String(msg.id)) || {}
  const likes = Number(e.likes ?? msg.likes ?? store.likes ?? 0) | 0
  const replies = Number(e.replies ?? msg.replies ?? 0) | 0
  const dislikes = Number(e.dislikes ?? msg.dislikes ?? store.dislikes ?? 0) | 0
  return { ...msg, engagement: { likes, replies, dislikes } }
}

// Helpers to generate mock trades and trending
function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function genMockTrades(count=12){
  const fighters = ['Bivol','Beterbiev','Inoue','Crawford','Spence','Haney','Taylor','Usyk','Fury']
  const out=[]
  for(let i=0;i<count;i++){
    const side = Math.random()>0.5 ? 'buy' : 'sell'
    const price = Math.round((500 + Math.random()*50000))
    const quantity = Math.ceil(Math.random()*5)
    const ts = Date.now() - Math.floor(Math.random()*2*60*60*1000) // last 2h
    out.push({ id: `t${i+1}`, fighterName: randChoice(fighters), side, price, quantity, timestamp: ts })
  }
  // Newest last for marquee loop aesthetics
  return out.sort((a,b)=>a.timestamp-b.timestamp)
}
function genMockTrending(){
  const names = ['Bivol','Beterbiev','Inoue','Crawford','Spence','Haney','Taylor','Usyk','Fury']
  return Array.from({length:6}).map((_,i)=>{
    const fvNow = Math.round(1200 + Math.random()*57000)
    const pct = Math.round(((Math.random()*1.3)-0.3)*1000)/10 // -30%..+100% → clamp later
    const sevenDayChangePct = Math.max(-5, Math.min(65, pct))
    return { fighterId: `f${i+1}`, fighterName: names[i], sevenDayChangePct, fvNow, rank: i+1 }
  })
}

// File-based mock helpers and mock stream broadcast
function genMockTradesFromFile(){
  const rows = Array.isArray(tradesJSON) ? tradesJSON : []
  return rows.map(r => ({ ...r, timestamp: parseMaybeNow(r.timestamp) }))
            .sort((a,b)=>a.timestamp-b.timestamp)
}
function genMockTrendingFromFile(){
  return Array.isArray(trendingJSON) ? trendingJSON : []
}
const __subscribers = []
let __interval = null
function __ensureInterval(){
  if (__interval || !MOCK) return
  __interval = setInterval(()=>{
    const batchSize = 1 + Math.floor(Math.random()*2)
    const batch = Array.from({length: batchSize}).map((_,i)=>({
      id: `m_live_${Date.now()}_${i}`,
      author: `0x${Math.random().toString(16).slice(2,6)}...${Math.random().toString(16).slice(2,6)}`,
      content: randChoice([
        'Big offer just landed.',
        'Secondary prices ticking up.',
        'Undercard buzz is real.',
        'Gym rumors heat up.'
      ]),
      timestamp: Date.now(),
      fanTier: Math.ceil(Math.random()*4),
      fightfolioValue: Math.round(50000 + Math.random()*2950000),
      score: 0,
    }))
    __broadcast(batch)
  }, 8000)
}
function __broadcast(batch){
  __subscribers.forEach(fn=>{ try{ fn(batch) }catch{} })
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
    if (MOCK) return mockFighters
    try { return await fetchAPI('/fighters') } catch { return mockFighters }
  },

  async getFighter(id) {
    if (MOCK){
      const prof = fighterProfilesJSON?.[id]
      if (prof) return prof
      return mockFighters.find(f => String(f.id) === String(id)) || null
    }
    try { return await fetchAPI(`/fighters/${id}`) } catch { return mockFighters.find(f => String(f.id) === String(id)) || null }
  },

  // Fighter news
  async getFighterNews(fighterId) {
    try {
      return await fetchAPI(`/fighters/${encodeURIComponent(fighterId)}/news`)
    } catch (e) {
      return []
    }
  },

  async createFighterNews(fighterId, { type, title, url, publishedAt, adminToken }) {
    const res = await fetch(`${API_BASE}/admin/fighters/${encodeURIComponent(fighterId)}/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(adminToken ? { 'x-admin-token': adminToken } : {}) },
      body: JSON.stringify({ type, title, url, publishedAt })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new APIError(data?.error || 'Create failed', res.status, data)
    return data
  },

  async updateFighterNews(fighterId, newsId, patch, adminToken) {
    const res = await fetch(`${API_BASE}/admin/fighters/${encodeURIComponent(fighterId)}/news/${encodeURIComponent(newsId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(adminToken ? { 'x-admin-token': adminToken } : {}) },
      body: JSON.stringify(patch || {})
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new APIError(data?.error || 'Update failed', res.status, data)
    return data
  },

  async deleteFighterNews(fighterId, newsId, adminToken) {
    const res = await fetch(`${API_BASE}/admin/fighters/${encodeURIComponent(fighterId)}/news/${encodeURIComponent(newsId)}`, {
      method: 'DELETE',
      headers: { ...(adminToken ? { 'x-admin-token': adminToken } : {}) }
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new APIError(data?.error || 'Delete failed', res.status, data)
    return data
  },
  
  // Admin: update fighter fields (e.g., attendanceSourceUrl)
  async updateFighter(id, patch) {
    const res = await fetch(`${API_BASE}/admin/fighters/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch || {})
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new APIError(data?.error || 'Update failed', res.status, data)
    return data
  },

  // Trading Ring messages
  async getMessages() {
    if (MOCK) {
      // Return a copy so callers can sort/mutate safely
      const base = [...MOCK_MESSAGES]
      // pad to ~10 entries within last 24h
      while (base.length < 10) {
        base.push({
          id: `m${base.length+1}`,
          author: `0x${Math.random().toString(16).slice(2,6)}...${Math.random().toString(16).slice(2,6)}`,
          content: randChoice([
            'Inoue vs. Tank at 126 would be chaos.',
            'Usyk-Fury II needs a bigger venue.',
            'Haney-Taylor at 140 > rematch at 135.',
            'Bam vs. Sunny for all the belts.',
            'Canelo still the A-side at 168.'
          ]),
          timestamp: Date.now() - Math.floor(Math.random()*24*60*60*1000),
          fanTier: Math.ceil(Math.random()*4),
          fightfolioValue: Math.round(500 + Math.random()*29500),
          score: 0,
        })
      }
      // attach engagement defaults and any mock reactions
      return base.map(ensureEngagementShape)
    }
    try {
      const arr = await fetchAPI('/messages')
      return (Array.isArray(arr) ? arr : []).map(ensureEngagementShape)
    } catch (e) {
      // safe fallback to mock with engagement defaults
      return (mockMessages || []).map(ensureEngagementShape)
    }
  },

  // Auth
  async me(){
    const res = await fetch(`${API_BASE}/auth/me`)
    if (!res.ok) throw new Error('Not logged in')
    return await res.json()
  },
  async login({ email, password }){
    const res = await fetch(`${API_BASE}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
    const data = await res.json().catch(()=>({}))
    if (!res.ok) throw new Error(data?.error || 'Login failed')
    return data
  },
  async signup({ email, password }){
    const res = await fetch(`${API_BASE}/auth/signup`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
    const data = await res.json().catch(()=>({}))
    if (!res.ok) throw new Error(data?.error || 'Signup failed')
    return data
  },

  async postMessage(messageData) {
    // Always include flat $1 posting fee in payload
    const payload = { ...messageData, feeUsd: 1.00 }
    if (MOCK) {
      const newMessage = {
        id: String(Date.now()),
        author: '0xFAKE...0001',
        timestamp: Date.now(),
        score: 0,
        ...messageData,
      }
      return newMessage
    }
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
      body: JSON.stringify(payload)
    }, newMessage)
  },

  async reactToMessage(id, action){
    // Accept: 'like','dislike','undo-like','undo-dislike'
    const key = String(id)
    if (MOCK) {
      const curr = __reactionStore.get(key) || { likes: 0, dislikes: 0 }
      if (action === 'like') curr.likes = Math.max(0, (curr.likes||0) + 1)
      else if (action === 'dislike') curr.dislikes = Math.max(0, (curr.dislikes||0) + 1)
      else if (action === 'undo-like') curr.likes = Math.max(0, (curr.likes||0) - 1)
      else if (action === 'undo-dislike') curr.dislikes = Math.max(0, (curr.dislikes||0) - 1)
      __reactionStore.set(key, curr)
      return { ok: true }
    }
    // Real mode: try API, but if not present, resolve ok so UI won't break
    try{
      await fetch(`${API_BASE}/messages/${encodeURIComponent(key)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      // Even if non-2xx, we swallow below to keep {ok:true}
      return { ok: true }
    }catch{
      return { ok: true }
    }
  },

  // Payments
  async createCheckout({ amountUsd, purpose, fighterId, qty }) {
    try {
      const payload = { amountUsd, purpose, fighterId, qty }
      const res = await fetch(`${API_BASE}/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new APIError(data?.error || 'Checkout failed', res.status, data)
      return data // { ok, url?, orderId }
    } catch (e) {
      if (MOCK) return { ok: true, orderId: `mock_${Date.now()}` }
      throw e
    }
  },

  // Minting
  async quoteMint({ fighterId, qty }) {
    try {
      const res = await fetch(`${API_BASE}/mints/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fighterId, qty })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new APIError(data?.error || 'Quote failed', res.status, data)
      return data // { ok:true, currency, lineItems, totalUsd }
    } catch (e) {
      if (MOCK) {
        const q = Number(qty||1)
        const base = 5*q, platform = base*0.1, network=0.25
        return { ok:true, currency:'USD', lineItems:[{label:`Base (${q} @ $5.00)`, amountUsd:+base.toFixed(2)},{label:'Platform fee (10%)', amountUsd:+platform.toFixed(2)},{label:'Network fee', amountUsd:+network.toFixed(2)}], totalUsd:+(base+platform+network).toFixed(2) }
      }
      throw e
    }
  },

  async mintCard({ orderId }) {
    try {
      const res = await fetch(`${API_BASE}/mints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new APIError(data?.error || 'Mint failed', res.status, data)
      return data // { ok:true, receiptId, receipt }
    } catch (e) {
      if (MOCK) {
        const id = `r_${Date.now()}`
        return { ok:true, receiptId: id, receipt: { id, totalUsd: 5, lineItems: [], createdAt: new Date().toISOString() } }
      }
      throw e
    }
  },

  async getHoldings() {
    try {
      return await fetchAPI('/fightfolio/holdings')
    } catch (e) {
      if (MOCK) return []
      throw e
    }
  },

  // Trades (MOCK and placeholder real)
  async getTrades(){
    if (MOCK) return genMockTradesFromFile()
    try{
      return await fetchAPI('/trades')
    }catch{
      return []
    }
  },

  // Trending cards (MOCK and placeholder real)
  async getTrending(){
    if (MOCK) return genMockTrendingFromFile()
    try{
      return await fetchAPI('/trending')
    }catch{
      return []
    }
  },

  // Stream messages (MOCK)
  streamMessages(onBatch){
    if (!MOCK) return () => {}
    __ensureInterval()
    __subscribers.push(onBatch)
    return () => {
      const idx = __subscribers.indexOf(onBatch)
      if (idx >= 0) __subscribers.splice(idx,1)
      if (__subscribers.length === 0 && __interval){ clearInterval(__interval); __interval = null }
    }
  },
  injectMockMessage(msg){ if (MOCK) { __broadcast([msg]) } },

  // Fightfolio Value endpoints
  async getCurrentFV(fighterId) {
    return this.request(`/fighters/${fighterId}/fv`, {}, mockWeeklyFV[fighterId])
  },

  async getFVHistory(fighterId, weeks = 8) {
    return this.request(`/fighters/${fighterId}/fv/history?weeks=${weeks}`, {}, mockFVHistory[fighterId] || [])
  },

  async getUserProfile() {
    if (MOCK) {
      // Ensure FV is consistent with tier in MOCK mode
      const defaultTier = 2 // Analyst
      const defaultFV = 1250
      const tier = Number(defaultTier)
      const minByTier = { 1: 0, 2: 500, 3: 2500, 4: 10000 }
      const rawFV = Number(defaultFV)
      const fightfolioValue = Math.max(isFinite(rawFV) ? rawFV : 0, minByTier[tier] || 0)
      return { fightfolioValue, fanTier: tier }
    }
    return this.request('/profile', {}, {
      fightfolioValue: 4200,
      fanTier: 2,
      address: "0x1234...5678"
    })
  },

  // Fightfolio aggregate endpoint
  async getFightfolio() {
    if (MOCK) {
      return {
        fightfolioValue: 18250,
        fanTier: 3,
        holdings: [
          { fighterId: "bivol", fighterName: "Dmitry Bivol", qty: 3, fvNow: 5800, weeklyDeltaPct: 18.2, status: "Active" },
          { fighterId: "beterbiev", fighterName: "Artur Beterbiev", qty: 1, fvNow: 7400, weeklyDeltaPct: 6.4, status: "Active" },
          { fighterId: "crawford", fighterName: "Terence Crawford", qty: 2, fvNow: 1050, weeklyDeltaPct: -3.1, status: "Refunded" }
        ],
        offers: [
          { id: "o1", type: "Mint", fighterName: "Bivol", price: 1500, qty: 1, timestamp: Date.now()-1000*60*60*8 },
          { id: "o2", type: "Resale", fighterName: "Bivol", price: 1700, qty: 1, timestamp: Date.now()-1000*60*60*5 },
          { id: "o3", type: "Refund", fighterName: "Crawford", price: 1050, qty: 1, timestamp: Date.now()-1000*60*60*3, reason: "No supporting news" },
          { id: "o4", type: "Mint", fighterName: "Beterbiev", price: 7400, qty: 1, timestamp: Date.now()-1000*60*30 }
        ],
        activity: [
          { id: "a1", label: "Posted in Trading Ring", meta: "Score +12%", timestamp: Date.now()-1000*60*25 },
          { id: "a2", label: "Offer refunded", meta: "Crawford", timestamp: Date.now()-1000*60*180 },
          { id: "a3", label: "Minted new card", meta: "Beterbiev", timestamp: Date.now()-1000*60*30 }
        ]
      }
    }
    try {
      return await fetchAPI('/fightfolio')
    } catch (e) {
      return { fightfolioValue: 0, fanTier: 1, holdings: [], offers: [], activity: [] }
    }
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
export async function getJSON(url, init) {
  const res = await fetch(url, init)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error(`Non-JSON from ${url}: ${text?.slice(0,200)}`)
  }
}
