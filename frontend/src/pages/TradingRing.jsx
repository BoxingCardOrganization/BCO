import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import TradeTicker from '../components/trading-ring/TradeTicker'
import TrendingCards from '../components/trading-ring/TrendingCards'
import TierTabs from '../components/trading-ring/TierTabs'
import Timeline from '../components/trading-ring/Timeline'
import Composer from '../components/trading-ring/Composer'

function TradingRing(){
  const [searchParams] = useSearchParams()
  const [userFV, setUserFV] = useState(0)
  const [userTier, setUserTier] = useState(2)
  const [tierFilter, setTierFilter] = useState(null)
  const timelineRef = useRef(null)
  const autoCompose = searchParams.get('composer') === '1'

  useEffect(()=>{ (async()=>{ try{ const p = await api.getUserProfile(); setUserFV(p.fightfolioValue||0); setUserTier(p.fanTier||2) } catch{} })() },[])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TradeTicker />
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <div className="space-y-4">
            <Composer userFV={userFV} userTier={userTier} autoFocus={autoCompose} onPosted={(msg)=>timelineRef.current?.addLocal(msg)} />
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
              <TierTabs active={tierFilter} onChange={setTierFilter} />
            </div>
            <Timeline ref={timelineRef} tierFilter={tierFilter} />
          </div>
          <div className="space-y-4">
            <TrendingCards />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-1">How Scoring Works</h3>
              <p className="text-sm text-blue-800">Score = log(1 + FV) × Tier Multiplier × Time Decay × (1 + Engagement)</p>
            </div>
          </div>
        </div>
      </div>
      {/*
      DEV INSTRUCTIONS
      MOCK preview:
        - Windows: set VITE_MOCK=1 && npm run dev
        - macOS/Linux: VITE_MOCK=1 npm run dev
        - Open http://localhost:3000/trading-ring
      Real stack:
        - Terminal A (root): npm run chain
        - Terminal B (root): npm start
        - Terminal C (frontend/): npm run dev
      */}
    </div>
  )
}

export default TradingRing
