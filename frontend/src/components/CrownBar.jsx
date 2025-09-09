import React from 'react'

function Crown({ filled }) {
  const cls = filled ? 'text-yellow-500' : 'text-gray-300'
  return (
    <svg className={`w-4 h-4 ${cls}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 8l4 3 5-7 5 7 4-3v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    </svg>
  )
}

export default function CrownBar({ titles = [], max = 4 }) {
  const count = Math.min(Array.isArray(titles) ? titles.length : 0, max)
  return (
    <div className="flex items-center space-x-1" title={titles.join(', ')}>
      {Array.from({ length: max }).map((_, i) => (
        <Crown key={i} filled={i < count} />
      ))}
    </div>
  )
}

