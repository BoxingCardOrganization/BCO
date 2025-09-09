import React from 'react'
import { Link } from 'react-router-dom'
import CrownBar from './CrownBar'

function FighterCard({ fighter, onBuy }) {
  const formatUSD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))
  const delta = Number(fighter?.deltaFV || 0)
  const isUp = delta >= 0

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{fighter?.name}</h3>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {fighter?.fighterTier}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">FV (current)</span>
          <span className="font-medium">{formatUSD(fighter?.valuation)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Prev FV</span>
          <span className="font-medium">{formatUSD(fighter?.prevValuation)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Weekly Change</span>
          <div className="flex items-center gap-2">
            <span className={isUp ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {isUp ? '▲' : '▼'} {formatUSD(Math.abs(delta))}
            </span>
            <CrownBar titles={fighter?.titles || []} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onBuy?.(fighter)}
          className="flex-1 btn-primary text-sm"
        >
          Buy
        </button>
        <Link
          to={`/fighters/${fighter?.id}`}
          className="flex-1 btn-secondary text-center text-sm"
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}

export default FighterCard

