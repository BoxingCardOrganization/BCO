import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import FighterCard from '../components/FighterCard'
import PromoStrip from '../components/PromoStrip'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import logo from '../assets/logo.png'

function Home() {
  const [fighters, setFighters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTier, setSelectedTier] = useState('All')

  useEffect(() => {
    loadFighters()
  }, [])

  const loadFighters = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getFighters()
      setFighters(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tiers = ['All', 'PPV Star', 'A-Level Draw', 'Regional Headliner', 'Fringe Contender']
  const filteredFighters = selectedTier === 'All'
    ? fighters
    : fighters.filter(f => String(f.fighterTier || '').toLowerCase() === selectedTier.toLowerCase())

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with logo */}
      <div className="bg-white border-b border-gray-100 mb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex flex-col items-center text-center gap-2 sm:gap-2">
            <img src={logo} alt="BCO" className="h-56 w-auto" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-0">
              Fan Offers for Future Undisputed Title Tickets
            </h1>
            <p className="text-gray-600 max-w-3xl">
              Refundable at original mint. Resalable to peers. Redeemable with fighter opt in.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Link to="/onboarding" className="btn-secondary">Learn More</Link>
              <Link to="/offer-builder" className="btn-primary">Buy Cards</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Strip */}
      <PromoStrip
        type="info"
        message="Welcome! Supply caps are 50% of highest headlined attendance."
        actionText="Onboarding"
        actionLink="/onboarding"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tier Filters */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Fighters</h2>
          <div className="flex flex-wrap gap-2">
            {tiers.map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            {filteredFighters.map(f => (
              <FighterCard
                key={f.id}
                fighter={f}
                onBuy={(fighter) => {
                  // Placeholder: route to offer builder with prefill TODO
                  window.location.href = `/offer-builder?fighter=${encodeURIComponent(fighter.id)}`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
