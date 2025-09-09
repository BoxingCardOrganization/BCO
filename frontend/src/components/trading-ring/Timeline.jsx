import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { calculateScore, visibleRank } from '../../lib/scoring'
import Loading from '../Loading'
import ErrorState from '../ErrorState'
import EmptyState from '../EmptyState'
import MessageCard from './MessageCard'

function sortMessages(arr){
  const now = Date.now()
  return [...arr].map(m=>{
    const ageSec = Math.max(0,(now - m.timestamp)/1000)
    const s = m.score && m.score>0 ? m.score : calculateScore(m.fightfolioValue, m.fanTier, ageSec, 0)
    return { ...m, _rank: visibleRank(s) }
  }).sort((a,b)=> b._rank - a._rank || b.timestamp - a.timestamp)
}

const Timeline = forwardRef(function Timeline({ tierFilter }, ref){
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasNew, setHasNew] = useState(false)
  const containerRef = useRef(null)

  const load = async ()=>{
    try{ setLoading(true); setError(null); const res = await api.getMessages(); setMessages(sortMessages(res||[])) }
    catch(e){ setError(e.message) } finally { setLoading(false) }
  }

  useEffect(()=>{ load(); const unsub = api.streamMessages?.((batch)=>{
    if (!batch || batch.length===0) return
    setMessages(prev => sortMessages([...batch, ...prev]))
    if ((window.scrollY||0) > 100) setHasNew(true)
  }); return ()=>{ unsub && unsub() } },[])

  useImperativeHandle(ref, ()=>({
    addLocal(msg){ setMessages(prev => sortMessages([msg, ...prev])); window.scrollTo({top:0}) }
  }))

  const filtered = useMemo(()=>{
    if (!tierFilter) return messages
    return messages.filter(m => Number(m.fanTier) === Number(tierFilter))
  }, [messages, tierFilter])

  return (
    <div ref={containerRef} className="space-y-4">
      {hasNew && (
        <button type="button" onClick={()=>{ setHasNew(false); window.scrollTo({top:0, behavior:'smooth'}) }} className="mx-auto block px-3 py-1 text-xs rounded-full bg-black text-white">
          New posts
        </button>
      )}
      {loading && <Loading />}
      {error && <ErrorState title="Failed to load messages" description={error} onRetry={load} />}
      {!loading && !error && filtered.length===0 && (
        <EmptyState title="No messages" description="Be the first to share your insights in the Trading Ring!" actionText="Post First Message" onAction={()=>document.getElementById('message')?.focus()} />
      )}
      {!loading && !error && filtered.map(m => (
        <MessageCard key={m.id} message={m} />
      ))}
    </div>
  )
})

export default Timeline

