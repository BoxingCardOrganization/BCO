
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import FighterCard from '../components/FighterCard'
import PromoStrip from '../components/PromoStrip'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'

function Home() {
  const [fighters, setFighters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTier, setSelectedTier] = useState('all')

  useEffect(() => {
    loadFighters()
  }, [])

  const loadFighters = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getFighters()
      setFighters(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredFighters = selectedTier === 'all' 
    ? fighters 
    : fighters.filter(f => f.tier === selectedTier)

  const tiers = ['all', 'prospect', 'rising', 'veteran', 'legend']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-bco-primary to-bco-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Own the Ring
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Invest in boxing's future. Trade cards based on real fight attendance. 
              Build your Fightfolio and join the Trading Ring community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/onboarding" className="bg-white text-bco-primary px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Get Started
              </Link>
              <Link to="/offer-builder" className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">
                Build First Offer
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Strip */}
      <PromoStrip 
        type="info"
        message="🎉 Welcome to BCO MVP! Supply caps based on 50% of highest attendance."
        actionText="Learn More"
        actionLink="/onboarding"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tier Filters */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Fighter Cards</h2>
          <div className="flex flex-wrap gap-2">
            {tiers.map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  selectedTier === tier
                    ? 'bg-bco-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Fighter Grid */}
        {loading && <Loading />}
        
        {error && (
          <ErrorState 
            title="Failed to load fighters"
            description={error}
            onRetry={loadFighters}
          />
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredFighters.map(fighter => (
              <FighterCard 
                key={fighter.id} 
                fighter={fighter}
                showAddButton={true}
                onAdd={(fighter) => {
                  // Navigate to offer builder with pre-selected fighter
                  window.location.href = `/offer-builder?fighter=${fighter.id}`
                }}
              />
            ))}
          </div>
        )}

        {/* Trading Ring Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Trading Ring</h3>
            <Link to="/trading-ring" className="text-bco-primary hover:text-bco-primary/80 font-medium">
              View All →
            </Link>
          </div>
          <p className="text-gray-600 mb-4">
            Join the community discussion. Share insights and earn fan tier points.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 italic">
              "Lightning Lopez looking strong for his next fight! 🥊"
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">0x1234...5678 • Analyst Tier</span>
              <span className="text-xs text-gray-500">Score: 150</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
