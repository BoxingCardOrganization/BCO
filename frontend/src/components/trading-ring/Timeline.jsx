import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { rankMessage } from '@/lib/ranking'
import Loading from '../Loading'
import ErrorState from '../ErrorState'
import EmptyState from '../EmptyState'
import MessageCard from './MessageCard'

function sortMessages(arr){
  const now = Date.now()
  return [...(arr||[])].sort((a,b)=> (rankMessage(b, now) - rankMessage(a, now)) || ((b.timestamp||0) - (a.timestamp||0)))
}

const Timeline = forwardRef(function Timeline({ tierFilter, onMessagesChange, onFeedChange }, ref){
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasNew, setHasNew] = useState(false)
  const containerRef = useRef(null)

  const load = async ()=>{
    try{ 
      setLoading(true); setError(null); 
      const res = await api.getMessages(); 
      const sorted = sortMessages(res||[])
      setMessages(sorted)
      onMessagesChange?.(sorted)
    }
    catch(e){ setError(e.message) } finally { setLoading(false) }
  }

  useEffect(()=>{ 
    load(); 
    const unsub = api.streamMessages?.((batch)=>{
      if (!batch || batch.length===0) return
      const updater = (prev)=>{
        const merged = sortMessages([...(batch||[]), ...prev])
        onMessagesChange?.(merged)
        return merged
      }
      setMessages(updater)
      if ((window.scrollY||0) > 100) setHasNew(true)
    }); 
    return ()=>{ unsub && unsub() } 
  },[])

  useImperativeHandle(ref, ()=>({
    addLocal(msg){ 
      setMessages(prev => {
        const merged = sortMessages([msg, ...prev])
        onMessagesChange?.(merged)
        return merged
      })
      window.scrollTo({top:0}) 
    }
  }))

  // Merge engagement patch and re-sort, notify listeners
  const patchEngagement = (id, patch = {}) => {
    setMessages(prev => {
      const next = prev.map(m => {
        if (String(m.id) !== String(id)) return m
        const curr = m.engagement || {}
        return { ...m, engagement: { ...curr, ...patch } }
      })
      const sorted = sortMessages(next)
      onMessagesChange?.(sorted)
      // Also notify feed with post-filter array
      const forFeed = tierFilter ? sorted.filter(m => Number(m.fanTier) === Number(tierFilter)) : sorted
      onFeedChange?.(forFeed)
      return sorted
    })
  }

  const filtered = useMemo(()=>{
    if (!tierFilter) return messages
    return messages.filter(m => Number(m.fanTier) === Number(tierFilter))
  }, [messages, tierFilter])

  // Notify consumer with the final rendered array after sort/filter
  useEffect(() => {
    onFeedChange?.(filtered)
  }, [filtered, onFeedChange])

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
        <MessageCard key={m.id} message={m} onEngagementChange={patchEngagement} />
      ))}
    </div>
  )
})

export default Timeline

