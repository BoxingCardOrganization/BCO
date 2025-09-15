
import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { formatCurrency, formatNumber, formatTimeAgo } from '../lib/format'
import FighterStatTile from '../components/FighterStatTile'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'

function FighterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [fighter, setFighter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedFAQ, setExpandedFAQ] = useState(null)
  const [weeklyFV, setWeeklyFV] = useState(null)
  const [fvHistory, setFvHistory] = useState([])

  useEffect(() => {
    loadFighter()
  }, [id])

  const loadFighter = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getFighter(id)
      setFighter(data)
      
      // Load FV data
      try {
        const [currentFV, fvHistoryData] = await Promise.all([
          api.getCurrentFV(id),
          api.getFVHistory(id, 8) // Last 8 weeks
        ])
        setWeeklyFV(currentFV)
        setFvHistory(fvHistoryData)
      } catch (fvError) {
        console.log('FV data not available:', fvError.message)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorState title="Fighter not found" description={error} />
  if (!fighter) return <ErrorState title="Fighter not found" description="The requested fighter could not be found." />

  const supplyPercentage = fighter.currentCap > 0 
    ? (fighter.mintedCount / fighter.currentCap) * 100 
    : 0
  const available = Math.max(0, Number(fighter.currentCap || 0) - Number(fighter.mintedCount || 0))

  const faqItems = [
    {
      question: "How is the supply cap determined?",
      answer: "Supply caps are set at 50% of the fighter's highest recorded attendance. This creates scarcity based on real-world performance metrics."
    },
    {
      question: "Can the supply cap change?",
      answer: "Yes, caps can only increase when a fighter headlines an event with higher attendance than their previous record. Caps never decrease."
    },
    {
      question: "What happens when the cap is reached?",
      answer: "Once the supply cap is reached, no new cards can be minted for that fighter. Existing cards become the only tradeable supply."
    },
    {
      question: "How do refunds work?",
      answer: "Refunds are available at the original mint price only, not resale value. Resale represents demand signaling in the secondary market."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-bco-primary hover:text-bco-primary/80 mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Fighters
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{fighter.name}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span>{fighter.weight}</span>
                <span>•</span>
                <span>{fighter.record}</span>
                <span>•</span>
                <span className="capitalize">{fighter.tier}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                type="button"
                disabled={available === 0}
                onClick={() => navigate(`/buy-card/${fighter.id}`)}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {available > 0 ? 'Buy' : 'Sold Out'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <FighterStatTile 
            label="Current Price"
            value={formatCurrency(fighter.currentPrice)}
            sublabel="Per card"
            icon={
              <svg className="w-6 h-6 text-bco-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          
          <FighterStatTile 
            label="Fightfolio Value"
            value={weeklyFV ? formatCurrency(weeklyFV.fightfolioValue) : 'N/A'}
            sublabel="Weekly FV"
            icon={
              <svg className="w-6 h-6 text-bco-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          
          <FighterStatTile 
            label="Supply Minted"
            value={`${formatNumber(fighter.mintedCount)}/${formatNumber(fighter.currentCap)}`}
            sublabel={`${supplyPercentage.toFixed(1)}% of cap`}
            icon={
              <svg className="w-6 h-6 text-bco-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />
          
          <FighterStatTile 
            label="Highest Attendance"
            value={formatNumber(fighter.highestAttendance)}
            sublabel={fighter.attendanceSourceUrl ? (
              <a href={fighter.attendanceSourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">Headlined event</a>
            ) : 'Headlined event'}
            icon={
              <svg className="w-6 h-6 text-bco-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          
          <FighterStatTile 
            label="Last Fight"
            value={formatTimeAgo(new Date(fighter.lastFight).getTime())}
            sublabel="Most recent"
            icon={
              <svg className="w-6 h-6 text-bco-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Supply Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Supply Status</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Cards Minted</span>
              <span>{supplyPercentage.toFixed(1)}% of cap</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-bco-primary h-3 rounded-full transition-all"
                style={{ width: `${Math.min(supplyPercentage, 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>50% Rule:</strong> Supply cap is set at 50% of highest headlined attendance ({formatNumber(fighter.highestAttendance)}). 
              This creates {formatNumber(fighter.currentCap)} maximum cards for this fighter.
            </p>
          </div>
        </div>

        {/* Fightfolio Value Breakdown */}
        {weeklyFV && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Fightfolio Value Analysis</h2>
              <div className="text-sm text-gray-600">
                Week ending {weeklyFV.weekEnding}
              </div>
            </div>
            
            {/* Components Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(weeklyFV.components.offerSignal)}
                </div>
                <div className="text-sm text-blue-700">Offer Signal (40%)</div>
                <div className="text-xs text-blue-600">Based on offer volume & diversity</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(weeklyFV.components.resaleSignal)}
                </div>
                <div className="text-sm text-green-700">Resale Signal (30%)</div>
                <div className="text-xs text-green-600">Bounded to prevent speculation</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(weeklyFV.components.publicSignal)}
                </div>
                <div className="text-sm text-purple-700">Public Signal (30%)</div>
                <div className="text-xs text-purple-600">Normalized performance metrics</div>
              </div>
            </div>

            {/* News Factor */}
            {weeklyFV.components.newsFactor !== 1.0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-yellow-900">News Factor Applied</span>
                  <span className="text-lg font-bold text-yellow-900">
                    {weeklyFV.components.newsFactor.toFixed(2)}x
                  </span>
                </div>
                <div className="text-sm text-yellow-800 mt-1">
                  Recent news events have {weeklyFV.components.newsFactor > 1 ? 'positively' : 'negatively'} impacted the Fighter Value
                </div>
              </div>
            )}

            {/* FV History Chart */}
            {fvHistory.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">8-Week FV Trend</h3>
                <div className="flex items-end space-x-2 h-24">
                  {fvHistory.map((week, index) => {
                    const maxFV = Math.max(...fvHistory.map(w => w.fightfolioValue))
                    const height = (week.fightfolioValue / maxFV) * 100
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-bco-primary rounded-t"
                          style={{ height: `${height}%` }}
                          title={`${week.weekEnding}: ${formatCurrency(week.fightfolioValue)}`}
                        />
                        <div className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-top-left">
                          {week.weekEnding.slice(5)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Source Citations */}
            {weeklyFV.sources && Object.keys(weeklyFV.sources).length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Object.entries(weeklyFV.sources).map(([metric, url]) => url && (
                    <div key={metric} className="flex items-center justify-between">
                      <span className="text-gray-600 capitalize">{metric.replace(/([A-Z])/g, ' $1')}:</span>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-bco-primary hover:underline">
                        View Source
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{item.question}</span>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === index && (
                  <div className="px-4 pb-3 text-gray-600">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FighterPage
