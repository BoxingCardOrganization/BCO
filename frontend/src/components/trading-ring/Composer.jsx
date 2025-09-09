import React, { useState } from 'react'
import { api } from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { getTierName, getTierMultiplier, calculateScore } from '../../lib/scoring'

const tierColor = (tier)=>({
  1: 'bg-gray-100 text-gray-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-purple-100 text-purple-800',
  4: 'bg-orange-100 text-orange-800'
}[tier] || 'bg-gray-100 text-gray-800')

export default function Composer({ userFV, userTier, onPosted, autoFocus = false }){
  const [value, setValue] = useState('')
  const [posting, setPosting] = useState(false)

  const handleSubmit = async (e)=>{
    e.preventDefault()
    if (!value.trim() || posting) return
    try{
      setPosting(true)
      const score = calculateScore(userFV, userTier, 0, 0)
      const msg = await api.postMessage({ content: value.trim(), fightfolioValue: userFV, fanTier: userTier, score })
      onPosted?.(msg)
      setValue('')
    }catch(e){ alert('Failed to post message: '+e.message) }
    finally{ setPosting(false) }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Share your thoughts ($1.00 to post)</label>
          <textarea id="message" value={value} onChange={(e)=>setValue(e.target.value)} placeholder="What's your take on the upcoming fights?" className="input-base resize-none" rows={3} maxLength={280} autoFocus={autoFocus} />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">{value.length}/280 characters</span>
            <span className="text-sm text-gray-500">Cost: $1.00</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tierColor(userTier)}`}>{getTierName(userTier)} Tier</span>
            <span className="ml-2">FV: {formatCurrency(userFV)}</span>
            <span className="ml-2">Score multiplier: {getTierMultiplier(userTier)}x</span>
          </div>
          <button type="submit" disabled={!value.trim() || posting} className="btn-primary">{posting ? 'Posting...' : 'Post Message'}</button>
        </div>
      </form>
    </div>
  )
}
