import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { isMock, isMockOverride, enableMockViaQuery } from '../lib/devtools'
import MessageCard from '../components/trading-ring/MessageCard'
import TrendingCards from '../components/trading-ring/TrendingCards'

/*
DEV INSTRUCTIONS
MOCK (fastest preview):
  Windows: set VITE_MOCK=1 && npm run dev
  macOS/Linux: VITE_MOCK=1 npm run dev
  Open http://localhost:3000/preview
Quick override:
  Add '?mock=1' to URL to force mock; '?mock=0' to disable.

REAL (full stack):
  npm run stack
  Open http://localhost:3000
*/

export default function Preview(){
  const [fighters, setFighters] = useState([])
  const [messages, setMessages] = useState([])
  const [trades, setTrades] = useState([])
  const [trending, setTrending] = useState([])

  const mockOn = isMock() || isMockOverride()

  useEffect(()=>{ enableMockViaQuery() },[])

  useEffect(()=>{
    (async()=>{
      const [fs, ms, ts, tr] = await Promise.all([
        api.getFighters(),
        api.getMessages(),
        api.getTrades(),
        api.getTrending(),
      ])
      setFighters(fs||[])
      setMessages(ms||[])
      setTrades(ts||[])
      setTrending(tr||[])
    })()
  },[])

  const apiBase = import.meta?.env?.VITE_API_BASE || '/api'
  const rpcBase = import.meta?.env?.VITE_RPC_BASE || '/rpc'

  function injectOne(){
    if (!mockOn) return
    const item = {
      id: `m_preview_${Date.now()}`,
      author: `0x${Math.random().toString(16).slice(2,6)}...${Math.random().toString(16).slice(2,6)}`,
      content: 'Preview: injected test message',
      timestamp: Date.now(),
      fanTier: 2 + Math.floor(Math.random()*3),
      fightfolioValue: 100000 + Math.floor(Math.random()*900000),
      score: 0,
    }
    api.injectMockMessage?.(item)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <h1 className="text-2xl font-bold">System Preview</h1>
        <div className="flex flex-wrap gap-2">
          <span className={`chip ${mockOn ? 'bg-green-100 text-green-800':'bg-gray-100 text-gray-800'}`}>MOCK: {mockOn ? 'ON' : 'OFF'}</span>
          <span className="chip bg-gray-100 text-gray-800">API: {apiBase}</span>
          <span className="chip bg-gray-100 text-gray-800">RPC: {rpcBase}</span>
        </div>

        <div className="flex gap-3">
          <a className="btn-secondary" href="/">Home</a>
          <a className="btn-secondary" href="/trading-ring">Trading Ring</a>
          {fighters[0] && <a className="btn-secondary" href={`/fighter/${fighters[0].id}`}>First Fighter</a>}
          {mockOn && <button className="btn-primary" onClick={injectOne}>Inject 1 random message</button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-2">Stats</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div>fighters: {fighters.length}</div>
              <div>messages: {messages.length}</div>
              <div>trending: {trending.length}</div>
              <div>trades: {trades.length}</div>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Trending Sample</h3>
            <TrendingCards />
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">MessageCard Sample</h3>
          {messages[0] ? <MessageCard message={messages[0]} /> : <div className="text-gray-500">No messages</div>}
        </div>
      </div>
    </div>
  )
}

