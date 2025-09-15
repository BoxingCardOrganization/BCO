import React, { useMemo } from 'react'

export default function TrendingPosts({ sourceMessages = [] }){
  const top = useMemo(() => {
    const now = Date.now()
    const dayAgo = now - 24*60*60*1000
    const recent = (sourceMessages || []).filter(m => (m?.timestamp || 0) >= dayAgo)
    return recent
      .map(m => {
        const e = m?.engagement || {}
        const likes = Number(e.likes || 0)
        const replies = Number(e.replies || 0)
        const dislikes = Number(e.dislikes || 0)
        return { ...m, _trendScore: likes + 2*replies - 0.5*dislikes }
      })
      .sort((a,b) => (b._trendScore - a._trendScore) || ((b.timestamp||0)-(a.timestamp||0)))
      .slice(0,5)
  }, [sourceMessages])

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Trending Posts</h3>
      </div>
      <div className="px-4 py-2">
        {top.length === 0 && (
          <div className="py-4 text-sm text-gray-500">No trending posts yet.</div>
        )}
        {top.map((m, i) => (
          <button
            type="button"
            key={m.id || i}
            className="w-full text-left hover:bg-gray-50 rounded-md px-2"
            onClick={() => {
              if (m.id) {
                const el = document.getElementById(String(m.id))
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
          >
            <div className="flex items-start gap-3 py-2">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-900 text-white text-xs font-bold">{i+1}</div>
              <div className="flex-1">
                <div className="text-sm text-gray-900 line-clamp-2">{String(m.content || '').trim() || '(no content)'}</div>
                <div className="mt-1 text-xs text-gray-500">👍 {m?.engagement?.likes||0} · 👎 {m?.engagement?.dislikes||0} · 💬 {m?.engagement?.replies||0}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

