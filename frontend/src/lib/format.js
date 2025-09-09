
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount / 100) // Convert cents to dollars
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercent(decimal) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(decimal)
}

export function formatTimeAgo(timestamp) {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

export function formatAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatSupplyProgress(minted, cap) {
  if (cap === 0) return "Unlimited"
  return `${formatNumber(minted)} / ${formatNumber(cap)}`
}

export function formatRecord(wins, losses, draws) {
  return `${wins}-${losses}-${draws}`
}
