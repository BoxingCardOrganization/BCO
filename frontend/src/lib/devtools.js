export function isMock() {
  const v = import.meta?.env?.VITE_MOCK
  return String(v) === '1'
}

export function isMockOverride() {
  try {
    return localStorage.getItem('VITE_MOCK_OVERRIDE') === '1'
  } catch {
    return false
  }
}

export function enableMockViaQuery() {
  try {
    const url = new URL(window.location.href)
    const mock = url.searchParams.get('mock')
    if (mock === '1') {
      localStorage.setItem('VITE_MOCK_OVERRIDE', '1')
      alert('Preview Mock Override enabled. Reloading...')
      url.searchParams.delete('mock')
      window.location.replace(url.toString())
    } else if (mock === '0') {
      localStorage.removeItem('VITE_MOCK_OVERRIDE')
      alert('Preview Mock Override disabled. Reloading...')
      url.searchParams.delete('mock')
      window.location.replace(url.toString())
    }
  } catch {}
}

