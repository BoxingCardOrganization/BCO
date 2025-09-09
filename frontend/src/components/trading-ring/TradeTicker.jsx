import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatTimeAgo, formatNumber } from '../../lib/format'

function TickerItem({ t }){
  const badge = t.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
  const sideLabel = t.side?.toUpperCase()
  return (
    <div className="flex items-center gap-2 px-3 py-1 border-r border-gray-200">
      <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(t.timestamp)}</span>
      <span className={`chip ${badge}`}>{sideLabel}</span>
      <span className="text-sm font-medium text-gray-900">{t.fighterName}</span>
      <span className="text-xs text-gray-600">{formatNumber(t.quantity)} @ ${formatNumber(t.price)}</span>
    </div>
  )
}

export default function TradeTicker(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async ()=>{
    try{
      setLoading(true); setError(null)
      const res = await api.getTrades()
      setItems(res || [])
    }catch(e){ setError(e.message) } finally { setLoading(false) }
  }

  useEffect(()=>{ load(); const id = setInterval(load, 15000); return ()=>clearInterval(id) },[])

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 text-xs text-gray-600">Live Trades</div>
      <div className="relative overflow-hidden">
        {loading && <div className="p-2 text-xs text-gray-500">Loading…</div>}
        {error && <div className="p-2 text-xs text-red-600">{error}</div>}
        {!loading && !error && items.length > 0 && (
          <div className="flex marquee">
            {[...items, ...items].map((t,i)=>(
              <TickerItem key={t.id + '_' + i} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

