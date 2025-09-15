import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, getJSON } from '../lib/api'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'
import CrownBar from '../components/CrownBar'

function FighterProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [fighter, setFighter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)

  const formatUSD = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n || 0))

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getJSON(`/api/fighters/${encodeURIComponent(id)}`)
      setFighter(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  useEffect(() => {
    let didCancel = false
    async function loadNews(){
      try{
        setNewsLoading(true)
        const items = await api.getFighterNews(id)
        if (!didCancel) setNews(Array.isArray(items) ? items : [])
      }catch{
        if (!didCancel) setNews([])
      } finally {
        if (!didCancel) setNewsLoading(false)
      }
    }
    if (id) loadNews()
    return ()=>{ didCancel = true }
  }, [id])

  if (loading) return <Loading />
  if (error) return <ErrorState title="Failed to load fighter" description={error} onRetry={load} />
  if (!fighter) return <ErrorState title="Not found" description="Fighter not found" />

  const delta = Number(fighter.deltaFV || 0)
  const isUp = delta >= 0
  const currentCap = Number(fighter.currentCap || 0)
  const mintedCount = Number(fighter.mintedCount || 0)
  const available = Math.max(0, currentCap - mintedCount)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center text-bco-primary hover:text-bco-primary/80 mb-6">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{fighter.name}</h1>
              <div className="text-gray-700">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {fighter.fighterTier}
                </span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <button
                type="button"
                disabled={available === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => navigate(`/buy-card/${fighter.id}`)}
              >
                {available > 0 ? 'Buy' : 'Sold Out'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <CrownBar titles={fighter.titles || []} />
            <span className="text-sm text-gray-600">
              {Array.isArray(fighter.titles) && fighter.titles.length > 0 ? fighter.titles.join(' • ') : 'No recognized titles'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">FV (current)</div>
              <div className="text-xl font-semibold">{formatUSD(fighter.valuation)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Prev FV</div>
              <div className="text-xl font-semibold">{formatUSD(fighter.prevValuation)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Weekly Change</div>
              <div className={`text-xl font-semibold ${isUp ? 'text-green-600' : 'text-red-600'}`}>{isUp ? '▲' : '▼'} {formatUSD(Math.abs(delta))}</div>
            </div>
          </div>
        </div>

        {/* News */}
        <section className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">News</h3>
          </div>
          {newsLoading ? (
            <div className="text-sm text-gray-500">Loading.</div>
          ) : (news.length === 0 ? (
            <div className="text-sm text-gray-500">No news yet</div>
          ) : (
            <ul className="space-y-2">
              {news.slice(0,6).map(n => (
                <li key={n.id} className="flex items-start gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${n.type==='video' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {n.type === 'video' ? 'Video' : 'Article'}
                  </span>
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-900 hover:underline line-clamp-2">
                    {n.title}
                  </a>
                  <span className="ml-auto text-xs text-gray-500">{new Date(n.publishedAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ))}
        </section>

        {/* Stats */}
        {fighter.stats && Object.keys(fighter.stats).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(fighter.stats).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="text-gray-600 capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="text-gray-900 font-medium">{String(v?.value ?? v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default FighterProfile

