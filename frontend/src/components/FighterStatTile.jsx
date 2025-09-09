
import React from 'react'

function FighterStatTile({ label, value, sublabel, trend, icon }) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sublabel && (
            <p className="text-sm text-gray-500 mt-1">{sublabel}</p>
          )}
        </div>
        
        {icon && (
          <div className="w-10 h-10 bg-bco-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className={`flex items-center mt-2 text-sm ${trendColors[trend.direction]}`}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {trend.direction === 'up' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            )}
            {trend.direction === 'down' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            )}
            {trend.direction === 'neutral' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            )}
          </svg>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  )
}

export default FighterStatTile
