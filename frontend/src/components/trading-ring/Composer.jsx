import React, { useState } from 'react'
import { api } from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { getTierName, calculateScore } from '../../lib/scoring' // ⬅️ removed getTierMultiplier import

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
      // step 0: ensure $1 posting fee checkout
      try{
        const ck = await api.createCheckout({ amountUsd: 1.00, purpose: 'message' })
        if (ck?.url) { window.location = ck.url; return }
      }catch(_e){ /* ignore in mock or proceed */ }
      // keep scoring logic internal (no UI exposure)
      const score = calculateScore(userFV, userTier, 0, 0)
      const msg = await api.postMessage({
        content: value.trim(),
        fightfolioValue: userFV,
        fanTier: userTier,
        score
      })
      onPosted?.(msg)
      setValue('')
    }catch(e){
      alert('Failed to post message: ' + e.message)
    }finally{
      setPosting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Share your thoughts ($1.00 to post)
          </label>
          {/* Added id for deep-link focus */}
          <textarea
            id="message"
            name="message"
            value={value}
            onChange={(e)=>setValue(e.target.value)}
            autoFocus={!!autoFocus}
            rows={3}
            placeholder="What are you seeing in the market?"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-bco-primary focus:ring-bco-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`chip ${tierColor(userTier)}`}>{getTierName(userTier)}</span>
            {typeof userFV === 'number' && (
              <span className="text-xs text-gray-500">FV: {formatCurrency(userFV || 0)}</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">Fee: $1.00</span>
            <button
              type="submit"
              disabled={posting || !value.trim()}
              className="inline-flex items-center px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
            >
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>

  )
}

