const users = new Map()
const holdings = new Map() // userId -> array of { fighterId, qty, avgUsd, lastUpdated }
const receipts = new Map() // id -> { id, userId, type, currency, lineItems, totalUsd, createdAt, txHash?, stripePaymentId? }
const orders = new Map() // id -> { id, userId, fighterId, qty, unitPriceUsd, status, createdAt, stripePaymentId? }

module.exports = {
  users,
  holdings,
  receipts,
  orders,
}

