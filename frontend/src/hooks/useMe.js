import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

let cached = undefined // undefined = not loaded, null = not authed, object = user
const subs = new Set()

async function loadMe() {
  try {
    const u = await api.me()
    cached = u || null
  } catch {
    cached = null
  } finally {
    subs.forEach(fn => {
      try { fn(cached) } catch {}
    })
  }
}

export function useMe() {
  const [me, setMe] = useState(cached === undefined ? null : cached)
  const [loading, setLoading] = useState(cached === undefined)

  useEffect(() => {
    const sub = (val) => { setMe(val); setLoading(false) }
    subs.add(sub)
    if (cached === undefined) {
      loadMe()
    } else {
      // ensure loading reflects current cache state
      setLoading(false)
    }
    return () => subs.delete(sub)
  }, [])

  const refresh = async () => {
    setLoading(true)
    await loadMe()
  }

  return { me, loading, refresh }
}

