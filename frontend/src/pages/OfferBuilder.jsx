
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import FighterCard from '../components/FighterCard'
import StickyOfferSlip from '../components/StickyOfferSlip'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

function OfferBuilder() {
  const [searchParams] = useSearchParams()
  const [fighters, setFighters] = useState([])
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadFighters()
  }, [])

  useEffect(() => {
    // Pre-select fighter from URL params
    const fighterId = searchParams.get('fighter')
    if (fighterId && fighters.length > 0) {
      const fighter = fighters.find(f => f.id === parseInt(fighterId))
      if (fighter) {
        addToOffer(fighter)
      }
    }
  }, [fighters, searchParams])

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

  const addToOffer = (fighter) => {
    const existingIndex = offers.findIndex(offer => offer.fighterId === fighter.id)
    
    if (existingIndex >= 0) {
      // Increase quantity
      const newOffers = [...offers]
      newOffers[existingIndex].quantity += 1
      newOffers[existingIndex].amount = newOffers[existingIndex].quantity * fighter.currentPrice
      setOffers(newOffers)
    } else {
      // Add new offer
      const newOffer = {
        fighterId: fighter.id,
        fighterName: fighter.name,
        quantity: 1,
        pricePerCard: fighter.currentPrice,
        amount: fighter.currentPrice
      }
      setOffers([...offers, newOffer])
    }
  }

  const removeFromOffer = (index) => {
    const newOffers = offers.filter((_, i) => i !== index)
    setOffers(newOffers)
  }

  const confirmOffer = (offers) => {
    // TODO: Process the offer
    console.log('Confirming offer:', offers)
    alert('Offer confirmed! (This would process the transaction in production)')
  }

  const filteredFighters = fighters.filter(fighter => 
    fighter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fighter.tier.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Your Offer</h1>
          <p className="text-gray-600">
            Select fighter cards to build your Fight Folio. Cards are minted based on attendance-driven supply caps.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search fighters by name or tier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-base"
            />
          </div>
        </div>

        {/* Content */}
        {loading && <Loading />}
        
        {error && (
          <ErrorState 
            title="Failed to load fighters"
            description={error}
            onRetry={loadFighters}
          />
        )}

        {!loading && !error && filteredFighters.length === 0 && (
          <EmptyState 
            title="No fighters found"
            description="Try adjusting your search terms"
            icon={
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        )}

        {!loading && !error && filteredFighters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFighters.map(fighter => (
              <FighterCard 
                key={fighter.id} 
                fighter={fighter}
                showAddButton={true}
                onAdd={addToOffer}
              />
            ))}
          </div>
        )}

        {/* Offer Guidance */}
        {offers.length === 0 && !loading && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-2">Getting Started</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Select fighter cards to add to your offer</li>
              <li>• Supply caps are 50% of highest attendance</li>
              <li>• Once cap is reached, no more cards can be minted</li>
              <li>• Refunds available at original mint price only</li>
            </ul>
          </div>
        )}
      </div>

      {/* Sticky Offer Slip */}
      <StickyOfferSlip 
        offers={offers}
        onRemove={removeFromOffer}
        onConfirm={confirmOffer}
        isVisible={offers.length > 0}
      />
    </div>
  )
}

export default OfferBuilder
