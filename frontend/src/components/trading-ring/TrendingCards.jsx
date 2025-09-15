import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatCurrency } from '../../lib/format'

export default function TrendingCards({ layout = 'list' }){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.getTrending()
      setItems(res || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  const hasNoData = !loading && !error && (!items || items.length === 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h3 className="text-sm font-semibold text-gray-900">Trending Cards</h3>
      </div>
      {loading && <div className="p-4 text-sm text-gray-500">Loading.</div>}
      {error && <div className="p-4 text-sm text-gray-500">No live data</div>}

      {!loading && !error && layout === 'grid' && (
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {(items || []).slice(0, 8).map((it) => {
              const up = (it.sevenDayChangePct || 0) >= 0
              return (
                <div key={it.rank} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm">
                  <div className="text-sm font-medium text-gray-900 truncate">{it.fighterName}</div>
                  <div className="mt-1 text-xs text-gray-500">{formatCurrency(it.fvNow || 0)}</div>
                  <div className={`mt-2 text-sm font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
                    {up ? '▲' : '▼'} {Math.abs(it.sevenDayChangePct || 0).toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
          {hasNoData && (
            <div className="p-2 text-sm text-gray-500">No live data</div>
          )}
        </div>
      )}

      {!loading && !error && layout !== 'grid' && (
        <ul className="divide-y divide-gray-100">
          {items.slice(0, 6).map((it) => {
            const up = (it.sevenDayChangePct || 0) >= 0
            return (
              <li key={it.rank} role="button" className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                    {it.rank}
                    {(() => { const t = it.updatedAt || it.lastTradeAt || it.timestamp; return t && (Date.now() - Number(t) < 60000) })() && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{it.fighterName}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(it.fvNow || 0)}</div>
                  </div>
                </div>
                <div className={`text-sm font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>{up ? '▲' : '▼'} {Math.abs(it.sevenDayChangePct || 0).toFixed(1)}%</div>
              </li>
            )
          })}
        </ul>
      )}

      {hasNoData && layout !== 'grid' && (
        <div className="p-4 text-sm text-gray-500">No live data</div>
      )}
    </div>
  )
}

