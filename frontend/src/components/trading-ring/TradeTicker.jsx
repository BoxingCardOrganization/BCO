import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { formatTimeAgo, formatNumber, formatAddress } from '../../lib/format'

function TierIcon({ tier }){
  const t = Number(tier)
  if (!t) return null
  const color = {1:'#6b7280',2:'#2563eb',3:'#7c3aed',4:'#ea580c'}[t] || '#6b7280'
  const title = {1:'Casual',2:'Analyst',3:'Historian',4:'Purist'}[t] || 'Fan'
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={color} aria-label={title} role="img">
      {t===4 ? (
        <path d="M3 7l4.5 3 4.5-5 4.5 5L21 7v10H3V7z"/>
      ) : t===3 ? (
        <path d="M4 7l4 3 4-4 4 4 4-3v10H4V7z"/>
      ) : t===2 ? (
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      ) : (
        <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"/>
      )}
    </svg>
  )
}

function TickerItem({ t }){
  const type = (t.type || '').toLowerCase()
  const accent = type==='mint' ? 'bg-blue-100 text-blue-800' : (type==='resell'||type==='resell') ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
  const verb = type==='mint' ? 'minted' : 'trade'
  const username = t.userMasked || t.username || t.user || t.address || t.author || 'Anon'
  const shortUser = typeof username === 'string' && username.startsWith('0x') ? formatAddress(username) : String(username)
  const qty = t.qty != null ? Number(t.qty) : (t.quantity != null ? Number(t.quantity) : undefined)
  const price = t.priceUsd != null ? Number(t.priceUsd) : (t.price != null ? Number(t.price) : undefined)
  const extra = null
  return (
    <div className="flex items-center gap-2 px-3 py-1 border-r border-gray-200">
      <span className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(t.ts || t.timestamp)}</span>
      <span className={`chip ${accent}`}>{verb.toUpperCase()}</span>
      {t.fanTier ? <TierIcon tier={t.fanTier} /> : null}
      <span className="text-xs text-gray-700">{shortUser}</span>
      <span className="text-sm font-medium text-gray-900">{t.fighterName || t.fighterId}</span>
      {qty != null && price != null && (
        <span className="text-xs text-gray-600">{formatNumber(qty)} @ ${formatNumber(price)}</span>
      )}
      {extra && <span className="text-xs text-gray-500">{extra}</span>}
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

  useEffect(()=>{ load(); const id = setInterval(load, 10000); return ()=>clearInterval(id) },[])

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 text-xs text-gray-600">Live Trades</div>
      <div className="relative overflow-hidden">
        {loading && <div className="p-2 text-xs text-gray-500">Loading…</div>}
        {error && <div className="p-2 text-xs text-gray-500">No live data</div>}
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

