
import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatTimeAgo, formatAddress, formatCurrency } from '../lib/format'
import { getTierName, getTierMultiplier, calculateScore } from '../lib/scoring'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'

function TradingRing() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [posting, setPosting] = useState(false)
  const [userFV, setUserFV] = useState(0)
  const [userTier, setUserTier] = useState(2)

  useEffect(() => {
    loadMessages()
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const profile = await api.getUserProfile()
      setUserFV(profile.fightfolioValue || 0)
      setUserTier(profile.fanTier || 2)
    } catch (err) {
      console.log('Could not load user profile:', err.message)
    }
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getMessages()
      // Sort by score (highest first)
      const sortedMessages = data.sort((a, b) => b.score - a.score)
      setMessages(sortedMessages)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePostMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || posting) return

    try {
      setPosting(true)
      
      // Calculate score using current FV
      const ageSeconds = 0 // New message
      const engagement = 0 // No engagement yet
      const score = calculateScore(userFV, userTier, ageSeconds, engagement)
      
      const messageData = {
        content: newMessage.trim(),
        fightfolioValue: userFV,
        fanTier: userTier,
        score: score
      }
      
      const message = await api.postMessage(messageData)
      setMessages([message, ...messages])
      setNewMessage('')
    } catch (err) {
      alert('Failed to post message: ' + err.message)
    } finally {
      setPosting(false)
    }
  }

  const getTierColor = (tier) => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-purple-100 text-purple-800',
      4: 'bg-orange-100 text-orange-800'
    }
    return colors[tier] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Ring</h1>
          <p className="text-gray-600">
            Share insights, discuss fighters, and earn fan tier points. Messages are scored based on your Fightfolio value and fan tier.
          </p>
        </div>

        {/* Message Composer */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handlePostMessage}>
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Share your thoughts ($1.00 to post)
              </label>
              <textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="What's your take on the upcoming fights?"
                className="input-base resize-none"
                rows={3}
                maxLength={280}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {newMessage.length}/280 characters
                </span>
                <span className="text-sm text-gray-500">
                  Cost: $1.00
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(userTier)}`}>
                  {getTierName(userTier)} Tier
                </span>
                <span className="ml-2">FV: {formatCurrency(userFV)}</span>
                <span className="ml-2">Score multiplier: {getTierMultiplier(userTier)}x</span>
              </div>
              <button 
                type="submit"
                disabled={!newMessage.trim() || posting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : 'Post Message'}
              </button>
            </div>
          </form>
        </div>

        {/* Messages Feed */}
        <div className="space-y-4">
          {loading && <Loading />}
          
          {error && (
            <ErrorState 
              title="Failed to load messages"
              description={error}
              onRetry={loadMessages}
            />
          )}

          {!loading && !error && messages.length === 0 && (
            <EmptyState 
              title="No messages yet"
              description="Be the first to share your insights in the Trading Ring!"
              actionText="Post First Message"
              onAction={() => document.getElementById('message')?.focus()}
              icon={
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
          )}

          {!loading && !error && messages.map((message) => (
            <div key={message.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-bco-primary to-bco-accent rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {message.author.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatAddress(message.author)}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTierColor(message.fanTier)}`}>
                        {getTierName(message.fanTier)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-bco-primary">
                    {Math.round(message.score)}
                  </div>
                  <div className="text-xs text-gray-500">score</div>
                </div>
              </div>
              
              <p className="text-gray-800 leading-relaxed">
                {message.content}
              </p>
              
              {/* Engagement Actions */}
              <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-100">
                <button className="flex items-center space-x-1 text-gray-500 hover:text-bco-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm">Like</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-500 hover:text-bco-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm">Reply</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-500 hover:text-bco-primary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Scoring Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">How Message Scoring Works</h3>
          <p className="text-sm text-blue-800">
            Score = log(1 + Fightfolio Value) × Fan Tier Multiplier × Time Decay × (1 + Engagement)
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>• Higher Fightfolio value = higher base score</li>
            <li>• Fan tier multipliers: Casual (1.0x), Analyst (1.2x), Historian (1.5x), Purist (2.0x)</li>
            <li>• Newer messages score higher than older ones</li>
            <li>• Likes and replies boost engagement score</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TradingRing

