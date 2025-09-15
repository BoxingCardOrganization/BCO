import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function Success(){
  const [search] = useSearchParams()
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    const orderId = search.get('o')
    if (!orderId) { setStatus('done'); return }
    (async()=>{
      try {
        setStatus('processing')
        await api.mintCard({ orderId })
        setStatus('done')
      } catch (e) {
        setError(e?.message || 'Purchase failed')
        setStatus('error')
      }
    })()
  }, [search])

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Payment Success</h1>
      {status === 'processing' && (
        <p className="text-sm text-gray-600">Finalizing your purchase.</p>
      )}
      {status === 'done' && (
        <>
          <p className="text-sm text-gray-700 mb-4">Your purchase is complete. View it in your Fightfolio.</p>
          <button className="btn-primary" onClick={()=>navigate('/fightfolio')}>Open Fightfolio</button>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="text-sm text-red-600 mb-4">{String(error)}</p>
          <button className="btn-secondary" onClick={()=>navigate('/fightfolio')}>Back to Fightfolio</button>
        </>
      )}
    </div>
  )
}

