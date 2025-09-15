import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import AuthModal from '../auth/AuthModal'

export default function FightfolioButton(){
  const [me, setMe] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = useNavigate()
  const menuRef = useRef(null)

  const loadMe = async()=>{
    try{ const u = await api.me(); setMe(u) } catch { setMe(null) }
  }
  useEffect(()=>{ loadMe() },[])

  useEffect(()=>{
    const onDoc = (e)=>{ if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return ()=>document.removeEventListener('mousedown', onDoc)
  },[])

  const onClick = ()=>{
    if (!me) setAuthOpen(true)
    else setMenuOpen(v=>!v)
  }

  const startAddFunds = async ()=>{
    setMenuOpen(false)
    try{
      const ck = await api.createCheckout({ amountUsd: 25.00, purpose: 'deposit' })
      if (ck?.url) { window.location = ck.url; return }
      // mock: consider funds added client-side
      alert('Mock: $25 deposit initiated. (No redirect)')
    }catch(e){ alert('Checkout failed: ' + (e?.message||'Unknown')) }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button className="btn-secondary text-sm" onClick={onClick}>Open Fightfolio</button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{ setMenuOpen(false); nav('/fightfolio') }}>View Fightfolio</button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={()=>{ setMenuOpen(false); nav('/offer-builder') }}>Buy Card</button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={startAddFunds}>Add Funds ($25)</button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50" onClick={()=>alert('Settings coming soon')}>Settings</button>
        </div>
      )}
      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuthed={()=>{ setAuthOpen(false); loadMe() }} />
    </div>
  )
}
