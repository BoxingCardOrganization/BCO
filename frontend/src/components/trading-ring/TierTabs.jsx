import React from 'react'
import { getTierName } from '../../lib/scoring'

const tabs = [
  { key: null, label: 'All' },
  { key: 4, label: getTierName(4) },
  { key: 3, label: getTierName(3) },
  { key: 2, label: getTierName(2) },
  { key: 1, label: getTierName(1) },
]

export default function TierTabs({ active, onChange }){
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(t => (
        <button
          key={String(t.key)}
          type="button"
          onClick={()=>onChange?.(t.key)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${active===t.key ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

