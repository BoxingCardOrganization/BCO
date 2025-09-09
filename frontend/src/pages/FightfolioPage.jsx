import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatCurrency, formatPercent, formatTimeAgo } from '../lib/format'
import { getTierMultiplier, getTierName } from '../lib/scoring'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

function Badge({ children, color = 'gray' }){
  const map = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[color] || map.gray}`}>
      {children}
    </span>
  )
}

export default function FightfolioPage(){
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getFightfolio()
      setData(res)
    } catch (e) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() },[])

  const tierName = useMemo(()=> getTierName(data?.fanTier || 1), [data])
  const tierMult = useMemo(()=> getTierMultiplier(data?.fanTier || 1), [data])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Fightfolio</h1>
          <p className="text-gray-600">Your Fighter Cards, value, and influence.</p>
        </div>

        {loading && <Loading />}
        {error && (
          <ErrorState title="Failed to load Fightfolio" description={error} onRetry={load} />
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Fightfolio Value</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency((data?.fightfolioValue || 0))}</p>
                </div>
                <div className="flex items-center gap-3 md:justify-center">
                  <Badge color="purple">Tier: {tierName}</Badge>
                </div>
                <div className="md:text-center">
                  <p className="text-sm text-gray-600">Score Multiplier</p>
                  <p className="text-xl font-semibold text-gray-900">{tierMult.toFixed(1)}x</p>
                </div>
                <div className="flex gap-3 md:justify-end">
                  <Link to="/trading-ring" className="btn-primary whitespace-nowrap">Go to Trading Ring</Link>
                  <a href="#offers" className="btn-secondary whitespace-nowrap">View Offers</a>
                </div>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Holdings and Offers */}
              <div className="lg:col-span-2 space-y-8">
                {/* Holdings */}
                <section id="holdings" className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>
                  </div>
                  {(!data?.holdings || data.holdings.length === 0) ? (
                    <EmptyState 
                      title="No cards yet"
                      description="Mint your first Fighter Card."
                      actionText="Go to Buy Cards"
                      onAction={() => navigate('/buy')}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fighter</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">7d Δ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {data.holdings.map((h) => {
                            const total = Number(h.qty || 0) * Number(h.fvNow || 0)
                            const delta = Number(h.weeklyDeltaPct || 0)
                            const up = delta >= 0
                            return (
                              <tr key={`${h.fighterId}`}>
                                <td className="px-6 py-3 text-sm text-gray-900">{h.fighterName}</td>
                                <td className="px-6 py-3 text-sm text-right text-gray-900">{h.qty}</td>
                                <td className="px-6 py-3 text-sm text-right font-medium">{formatCurrency(total)}</td>
                                <td className={`px-6 py-3 text-sm text-right ${up ? 'text-green-600' : 'text-red-600'}`}>
                                  {up ? '+' : ''}{formatPercent(delta/100)}
                                </td>
                                <td className="px-6 py-3 text-sm">
                                  <Badge color={h.status === 'Active' ? 'green' : (h.status === 'Refunded' ? 'red' : 'gray')}>
                                    {h.status}
                                  </Badge>
                                </td>
                                <td className="px-6 py-3 text-sm text-right">
                                  <Link to={`/fighters/${h.fighterId}`} className="btn-secondary text-xs px-3 py-1.5" role="button">View Profile</Link>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Resale */}
                <section id="offers" className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Resale</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {(data?.offers || []).slice().sort((a,b)=>b.timestamp-a.timestamp).map(o => {
                      const colors = {
                        Mint: 'green',
                        Resale: 'blue',
                        Refund: 'red',
                        Redeemed: 'yellow'
                      }
                      const badgeColor = colors[o.type] || 'gray'
                      return (
                        <div key={o.id} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge color={badgeColor}>{o.type}</Badge>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{o.fighterName}</div>
                              <div className="text-xs text-gray-600">{formatCurrency((o.price||0) * (o.qty||0))}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{formatTimeAgo(o.timestamp)}</div>
                        </div>
                      )
                    })}
                    {(!data?.offers || data.offers.length === 0) && (
                      <div className="px-6 py-8">
                        <EmptyState 
                          title="No resales yet" 
                          description="List a card for resale or post a resale message." 
                          actionText="Post in Trading Ring" 
                          onAction={() => navigate('/trading-ring?composer=1')} 
                        />
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right: Influence + Activity */}
              <div className="space-y-8">
                {/* Influence */}
                <section id="influence" className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Influence</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Fightfolio Value</span>
                      <span className="font-medium">{formatCurrency((data?.fightfolioValue||0))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Fan Tier</span>
                      <span className="font-medium">{tierName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Trading Ring Multiplier</span>
                      <span className="font-medium">{tierMult.toFixed(1)}x</span>
                    </div>
                  </div>
                </section>

                {/* Recent Activity */}
                <section id="activity" className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {(data?.activity || []).slice().sort((a,b)=>b.timestamp-a.timestamp).slice(0,10).map(a => (
                      <li key={a.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{a.label}</div>
                            {a.meta && <div className="text-xs text-gray-600">{a.meta}</div>}
                          </div>
                          <div className="text-xs text-gray-500">{formatTimeAgo(a.timestamp)}</div>
                        </div>
                      </li>
                    ))}
                    {(!data?.activity || data.activity.length === 0) && (
                      <li className="px-6 py-8">
                        <p className="text-sm text-gray-600">No recent activity.</p>
                      </li>
                    )}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
