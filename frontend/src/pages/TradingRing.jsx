// TradingRing.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import TradeTicker from '../components/trading-ring/TradeTicker'
import TrendingCards from '../components/trading-ring/TrendingCards'
import TierTabs from '../components/trading-ring/TierTabs'
import Timeline from '../components/trading-ring/Timeline'
import Composer from '../components/trading-ring/Composer'
import TrendingPosts from '../components/trading-ring/TrendingPosts'

export default function TradingRing(){
  const [searchParams] = useSearchParams()
  const [userFV, setUserFV] = useState(0)
  const [userTier, setUserTier] = useState(2)
  const [tierFilter, setTierFilter] = useState(null)
  const timelineRef = useRef(null)
  const autoCompose = searchParams.get('composer') === '1'
  const [timelineMessages, setTimelineMessages] = useState([])

  useEffect(()=>{ (async()=>{ try{ const p = await api.getUserProfile(); setUserFV(p.fightfolioValue||0); setUserTier(p.fanTier||2) } catch{} })() },[])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* 1) Ticker full-width */}
        <div className="sticky top-0 z-20">
          <TradeTicker />
        </div>

        {/* 2) Centered Trending Cards grid (full row, visually centered) */}
        <section className="flex justify-center">
          <div className="w-full max-w-5xl">
            <TrendingCards layout="grid" />
          </div>
        </section>

        {/* 3) Below: two-column area (feed left, trending posts right) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Composer
              userFV={userFV}
              userTier={userTier}
              autoFocus={autoCompose}
              onPosted={(msg)=>timelineRef.current?.addLocal(msg)}
            />
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
              <TierTabs active={tierFilter} onChange={setTierFilter} />
            </div>
            <Timeline
              ref={timelineRef}
              tierFilter={tierFilter}
              onFeedChange={setTimelineMessages}
            />
          </div>

          {/* RIGHT rail */}
          <aside className="lg:col-span-1 space-y-6">
            <TrendingPosts sourceMessages={timelineMessages} />
          </aside>
        </section>
      </div>
    </div>
  )
}
