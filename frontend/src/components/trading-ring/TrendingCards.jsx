import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatCurrency } from '../../lib/format'

export default function TrendingCards(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async ()=>{
    try{ setLoading(true); setError(null); const res = await api.getTrending(); setItems(res||[]) }
    catch(e){ setError(e.message) } finally { setLoading(false) }
  }
  useEffect(()=>{ load(); const id = setInterval(load, 60000); return ()=>clearInterval(id) },[])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h3 className="text-sm font-semibold text-gray-900">Trending Cards</h3>
      </div>
      {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
      {error && <div className="p-4 text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <ul className="divide-y divide-gray-100">
          {items.slice(0,6).map((it)=>{
            const up = (it.sevenDayChangePct||0) >= 0
            return (
              <li key={it.rank} role="button" className="px-4 py-3 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">{it.rank}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{it.fighterName}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(it.fvNow || 0)}</div>
                  </div>
                </div>
                <div className={`text-sm font-medium ${up ? 'text-green-600' : 'text-red-600'}`}>{up?'▲':'▼'} {Math.abs(it.sevenDayChangePct||0).toFixed(1)}%</div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

