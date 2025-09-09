import React from 'react'
import { formatTimeAgo, formatAddress } from '../../lib/format'
import { getTierName, calculateScore } from '../../lib/scoring'

const TIER_COLORS = {1:'bg-gray-100 text-gray-800',2:'bg-blue-100 text-blue-800',3:'bg-purple-100 text-purple-800',4:'bg-orange-100 text-orange-800'}

export default function MessageCard({ message }){
  const ageSec = Math.max(0, (Date.now() - message.timestamp)/1000)
  const score = message.score && message.score > 0 ? message.score : calculateScore(message.fightfolioValue, message.fanTier, ageSec, 0)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-bco-primary to-bco-accent rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">{String(message.author||'0x??').slice(2,4).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{formatAddress(message.author)}</p>
            <div className="flex items-center space-x-2">
              <span className={`chip ${TIER_COLORS[message.fanTier] || TIER_COLORS[1]}`}>{getTierName(message.fanTier)}</span>
              <span className="text-xs text-gray-500">{formatTimeAgo(message.timestamp)}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-bco-primary">{Math.round(score)}</div>
          <div className="text-xs text-gray-500">score</div>
        </div>
      </div>
      <p className="text-gray-800 leading-relaxed">{message.content}</p>
      <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-100">
        <button type="button" className="flex items-center space-x-1 text-gray-500 hover:text-bco-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          <span className="text-sm">Like</span>
        </button>
        <button type="button" className="flex items-center space-x-1 text-gray-500 hover:text-bco-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-sm">Reply</span>
        </button>
        <button type="button" className="flex items-center space-x-1 text-gray-500 hover:text-bco-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  )
}

