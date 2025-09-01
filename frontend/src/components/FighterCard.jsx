
import React from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatNumber, formatRecord } from '../lib/format'

function FighterCard({ fighter, showAddButton = false, onAdd }) {
  const supplyPercentage = fighter.currentCap > 0 
    ? (fighter.mintedCount / fighter.currentCap) * 100 
    : 0

  const tierColors = {
    prospect: 'bg-green-100 text-green-800',
    rising: 'bg-blue-100 text-blue-800', 
    veteran: 'bg-purple-100 text-purple-800',
    legend: 'bg-orange-100 text-orange-800'
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{fighter.name}</h3>
          <p className="text-sm text-gray-600">{fighter.weight}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[fighter.tier] || 'bg-gray-100 text-gray-800'}`}>
          {fighter.tier}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Record:</span>
          <span className="font-medium">{fighter.record}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Price:</span>
          <span className="font-medium">{formatCurrency(fighter.currentPrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Supply:</span>
          <span className="font-medium">
            {formatNumber(fighter.mintedCount)} / {formatNumber(fighter.currentCap)}
          </span>
        </div>
      </div>

      {/* Supply Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Minted</span>
          <span>{supplyPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-bco-primary h-2 rounded-full transition-all"
            style={{ width: `${Math.min(supplyPercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Link 
          to={`/fighter/${fighter.id}`}
          className="flex-1 btn-secondary text-center text-sm"
        >
          View Details
        </Link>
        {showAddButton && (
          <button 
            onClick={() => onAdd?.(fighter)}
            className="flex-1 btn-primary text-sm"
          >
            Add to Offer
          </button>
        )}
      </div>
    </div>
  )
}

export default FighterCard
