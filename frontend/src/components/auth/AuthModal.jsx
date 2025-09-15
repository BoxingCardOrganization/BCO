import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export default function AuthModal({ open, onClose, onAuthed }){
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(()=>{ if (!open){ setEmail(''); setPassword(''); setError(null); setMode('login') } }, [open])

  const submit = async (e)=>{
    e?.preventDefault?.()
    try{
      setLoading(true); setError(null)
      let res
      if (mode === 'signup') res = await api.signup({ email, password })
      else res = await api.login({ email, password })
      onAuthed?.(res)
      onClose?.()
    }catch(e){ setError(e?.message || 'Auth failed') } finally { setLoading(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{mode === 'signup' ? 'Create account' : 'Log in to Fightfolio'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form className="p-4 space-y-3" onSubmit={submit}>
          {error && <div className="text-xs text-red-600">{String(error)}</div>}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Please wait…' : (mode === 'signup' ? 'Create account' : 'Log in')}</button>
          <div className="text-xs text-gray-600 text-center">
            {mode === 'signup' ? (
              <button type="button" className="underline" onClick={()=>setMode('login')}>Have an account? Log in</button>
            ) : (
              <button type="button" className="underline" onClick={()=>setMode('signup')}>New here? Create account</button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

