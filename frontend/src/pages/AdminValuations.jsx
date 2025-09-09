
import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { computeFV, NEWS_FACTORS, NewsTags } from '../lib/valuation'
import { formatCurrency, formatNumber } from '../lib/format'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'

function AdminValuations() {
  const [fighters, setFighters] = useState([])
  const [selectedFighter, setSelectedFighter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  // Form data
  const [publicStats, setPublicStats] = useState({
    ppvBuys: '',
    gateRevenue: '',
    attendance: '',
    tvRatings: '',
    socialMentions: '',
    searchVolume: '',
    sources: {
      ppvBuys: '',
      gateRevenue: '',
      attendance: '',
      tvRatings: '',
      socialMentions: '',
      searchVolume: ''
    }
  })
  
  const [newsTags, setNewsTags] = useState({
    tags: [],
    newsItems: []
  })
  
  const [previewFV, setPreviewFV] = useState(null)
  const [weekEnding, setWeekEnding] = useState('')

  useEffect(() => {
    loadFighters()
    // Set default week ending to last Sunday
    const today = new Date()
    const lastSunday = new Date(today.setDate(today.getDate() - today.getDay()))
    setWeekEnding(lastSunday.toISOString().split('T')[0])
  }, [])

  const loadFighters = async () => {
    try {
      setLoading(true)
      const data = await api.getFighters()
      setFighters(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFighterSelect = async (fighter) => {
    setSelectedFighter(fighter)
    // Load last week's data if available
    try {
      const lastWeekData = await api.getWeeklyValuation(fighter.id, weekEnding)
      if (lastWeekData) {
        setPublicStats(lastWeekData.publicStats || publicStats)
        setNewsTags(lastWeekData.newsTags || newsTags)
      }
    } catch (err) {
      // No previous data, start fresh
      console.log('No previous data found')
    }
  }

  const handlePreviewFV = async () => {
    if (!selectedFighter) return

    try {
      // Get current demand and resale data
      const [demand, resale, refunds, previousFV] = await Promise.all([
        api.getFighterDemand(selectedFighter.id, weekEnding),
        api.getFighterResale(selectedFighter.id, weekEnding), 
        api.getFighterRefunds(selectedFighter.id, weekEnding),
        api.getPreviousFV(selectedFighter.id, weekEnding)
      ])

      // Check if refunds have matching news tags
      const hasMatchingNewsTag = refunds.refundReasons.some(reason => 
        newsTags.tags.some(tag => reason.toLowerCase().includes(tag.replace('_', ' ')))
      )

      const inputs = {
        publicStats: {
          ...publicStats,
          ppvBuys: parseInt(publicStats.ppvBuys) || 0,
          gateRevenue: parseInt(publicStats.gateRevenue) || 0,
          attendance: parseInt(publicStats.attendance) || 0,
          tvRatings: parseFloat(publicStats.tvRatings) || 0,
          socialMentions: parseInt(publicStats.socialMentions) || 0,
          searchVolume: parseInt(publicStats.searchVolume) || 0
        },
        demand,
        resale,
        newsTags,
        refunds: { ...refunds, hasMatchingNewsTag },
        fighterTier: selectedFighter.tier,
        previousFV: previousFV || 0
      }

      const result = computeFV(inputs)
      setPreviewFV(result)
    } catch (err) {
      alert('Error computing preview: ' + err.message)
    }
  }

  const handleSaveValuation = async () => {
    if (!selectedFighter || !previewFV) return

    try {
      setSaving(true)
      
      const valuation = {
        fighterId: selectedFighter.id,
        weekEnding,
        fightfolioValue: previewFV.fightfolioValue,
        components: previewFV.components,
        sources: publicStats.sources,
        publicStats,
        newsTags,
        publishedAt: new Date().toISOString(),
        publishedBy: 'admin' // In production, use actual admin user
      }

      await api.saveWeeklyValuation(valuation)
      alert('Valuation saved successfully!')
      
      // Reset form
      setPreviewFV(null)
      setSelectedFighter(null)
      setPublicStats({
        ppvBuys: '', gateRevenue: '', attendance: '', tvRatings: '', socialMentions: '', searchVolume: '',
        sources: { ppvBuys: '', gateRevenue: '', attendance: '', tvRatings: '', socialMentions: '', searchVolume: '' }
      })
      setNewsTags({ tags: [], newsItems: [] })
      
    } catch (err) {
      alert('Error saving valuation: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  if (error) return <ErrorState title="Failed to load fighters" description={error} />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Fighter Valuations</h1>
          <p className="text-gray-600">
            Enter weekly stats, mark news tags, and compute Fighter Values (FV) for the Trading Ring.
          </p>
        </div>

        {/* Week Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Ending</label>
              <input
                type="date"
                value={weekEnding}
                onChange={(e) => setWeekEnding(e.target.value)}
                className="input-base w-40"
              />
            </div>
            <div className="text-sm text-gray-600 pt-6">
              Select the Sunday ending the valuation week
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fighter Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Fighter</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {fighters.map((fighter) => (
                  <button
                    key={fighter.id}
                    onClick={() => handleFighterSelect(fighter)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedFighter?.id === fighter.id
                        ? 'border-bco-primary bg-bco-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{fighter.name}</div>
                    <div className="text-sm text-gray-600">{fighter.weight} • {fighter.tier}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Input Form */}
          <div className="lg:col-span-2">
            {selectedFighter ? (
              <div className="space-y-6">
                {/* Public Stats */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Public Stats - {selectedFighter.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'ppvBuys', label: 'PPV Buys', type: 'number' },
                      { key: 'gateRevenue', label: 'Gate Revenue ($)', type: 'number' },
                      { key: 'attendance', label: 'Attendance', type: 'number' },
                      { key: 'tvRatings', label: 'TV Ratings', type: 'number', step: '0.1' },
                      { key: 'socialMentions', label: 'Social Mentions', type: 'number' },
                      { key: 'searchVolume', label: 'Search Volume', type: 'number' }
                    ].map(({ key, label, type, step }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <input
                          type={type}
                          step={step}
                          value={publicStats[key]}
                          onChange={(e) => setPublicStats(prev => ({ ...prev, [key]: e.target.value }))}
                          className="input-base"
                        />
                        <input
                          type="url"
                          placeholder="Source URL"
                          value={publicStats.sources[key]}
                          onChange={(e) => setPublicStats(prev => ({ 
                            ...prev, 
                            sources: { ...prev.sources, [key]: e.target.value }
                          }))}
                          className="input-base mt-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* News Tags */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">News Tags</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {Object.values(NewsTags).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setNewsTags(prev => ({
                            ...prev,
                            tags: prev.tags.includes(tag) 
                              ? prev.tags.filter(t => t !== tag)
                              : [...prev.tags, tag]
                          }))
                        }}
                        className={`p-2 text-xs rounded-lg border transition-colors ${
                          newsTags.tags.includes(tag)
                            ? 'border-bco-primary bg-bco-primary text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {tag.replace('_', ' ').toUpperCase()}
                        {NEWS_FACTORS[tag] && (
                          <div className="text-xs opacity-75">
                            {NEWS_FACTORS[tag]}x
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Selected tags will be used to compute news factor and validate refund adjustments.
                  </div>
                </div>

                {/* Preview & Save */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Fighter Value Preview</h3>
                    <button
                      onClick={handlePreviewFV}
                      className="btn-secondary"
                    >
                      Compute Preview
                    </button>
                  </div>

                  {previewFV && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-900">
                          {formatCurrency(previewFV.fightfolioValue)}
                        </div>
                        <div className="text-sm text-blue-700">Fightfolio Value</div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{formatCurrency(previewFV.components.offerSignal)}</div>
                          <div className="text-xs text-gray-600">Offer Signal</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{formatCurrency(previewFV.components.resaleSignal)}</div>
                          <div className="text-xs text-gray-600">Resale Signal</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{formatCurrency(previewFV.components.publicSignal)}</div>
                          <div className="text-xs text-gray-600">Public Signal</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span>News Factor:</span>
                        <span className="font-medium">{previewFV.components.newsFactor.toFixed(2)}x</span>
                      </div>

                      <button
                        onClick={handleSaveValuation}
                        disabled={saving}
                        className="w-full btn-primary"
                      >
                        {saving ? 'Saving...' : 'Save Weekly Valuation'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center text-gray-500">
                  Select a fighter to begin entering weekly valuation data
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminValuations
