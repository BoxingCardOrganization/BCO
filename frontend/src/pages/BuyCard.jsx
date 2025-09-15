import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function BuyCard(){
  const { id: fighterId } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [posting, setPosting] = useState(false)

  const load = async ()=>{
    try{
      setLoading(true); setError(null)
      const q = await api.quoteMint({ fighterId, qty })
      setQuote(q)
    }catch(e){ setError(e?.message||'Failed to quote') } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [fighterId, qty])

  useEffect(()=>{
    const orderId = search.get('o')
    if (orderId){
      (async()=>{
        try{
          setPosting(true)
          const res = await api.mintCard({ orderId })
          alert('Purchase complete! Receipt: ' + res?.receiptId)
          navigate('/fightfolio')
        }catch(e){ alert('Purchase failed: '+(e?.message||'Unknown')) } finally { setPosting(false) }
      })()
    }
  },[search, navigate])

  const total = useMemo(()=> Number(quote?.totalUsd || 0), [quote])

  const payAndMint = async ()=>{
    try{
      setPosting(true)
      const ck = await api.createCheckout({ amountUsd: total, purpose: 'mint', fighterId, qty })
      if (ck?.url) { window.location = ck.url; return }
      // mock: directly mint
      const res = await api.mintCard({ orderId: ck?.orderId })
      alert('Purchase complete! Receipt: ' + res?.receiptId)
      navigate('/fightfolio')
    }catch(e){ alert('Checkout/Buy failed: '+(e?.message||'Unknown')) } finally { setPosting(false) }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Buy Card</h1>
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">Fighter ID</label>
        <div className="text-sm">{fighterId}</div>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">Quantity</label>
        <input type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1, Number(e.target.value)||1))} className="border rounded px-3 py-2 w-32" />
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Loading quote…</div>
      ) : error ? (
        <div className="text-sm text-red-600">{String(error)}</div>
      ) : (
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Quote</div>
          <ul className="text-sm text-gray-700 mb-2">
            {(quote?.lineItems||[]).map((li, i)=>(
              <li key={i} className="flex justify-between"><span>{li.label}</span><span>${Number(li.amountUsd).toFixed(2)}</span></li>
            ))}
          </ul>
          <div className="flex justify-between font-semibold"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      )}
      <button onClick={payAndMint} disabled={posting || loading} className="btn-primary">{posting ? 'Processing…' : 'Buy Now'}</button>
    </div>
  )
}
