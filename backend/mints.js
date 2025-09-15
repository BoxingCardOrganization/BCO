const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { quoteMint, mintWithSig } = require('./minting')
const { requireAuth } = require('./auth')
const { users, holdings, receipts, orders } = require('./db')

const router = express.Router()

// In-memory ticker of trades
const TRADES = []
function pushTrade(evt) {
  TRADES.unshift(evt)
  if (TRADES.length > 50) TRADES.pop()
}

function deriveTier(fvUsd) {
  const v = Number(fvUsd || 0)
  if (v >= 10000) return 4
  if (v >= 2500) return 3
  if (v >= 500) return 2
  return 1
}

// Quote endpoint
router.post('/mints/quote', requireAuth, express.json(), async (req, res) => {
  try {
    const { fighterId, qty } = req.body || {}
    const q = await quoteMint({ fighterId, qty })
    res.json({ ok: true, ...q })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Quote failed' })
  }
})

// Finalize mint from a paid order
router.post('/mints', requireAuth, express.json(), async (req, res) => {
  try {
    const { orderId } = req.body || {}
    const order = orders.get(String(orderId))
    if (!order || order.status !== 'paid') {
      return res.status(402).json({ error: 'Order is not paid or not found' })
    }
    // Recompute quote to persist
    const q = await quoteMint({ fighterId: order.fighterId, qty: order.qty })
    const { totalUsd, lineItems } = q

    // Perform mint (mockable)
    const { txHash } = await mintWithSig({ userId: req.user.id, fighterId: order.fighterId, qty: order.qty })

    // Save receipt
    const id = uuidv4()
    const receipt = {
      id,
      userId: req.user.id,
      type: 'mint',
      currency: 'USD',
      lineItems,
      totalUsd,
      createdAt: new Date().toISOString(),
      txHash,
      stripePaymentId: order.stripePaymentId,
    }
    receipts.set(id, receipt)

    // Update holdings and user FV
    const list = holdings.get(req.user.id) || []
    const idx = list.findIndex(h => String(h.fighterId) === String(order.fighterId))
    const prev = idx >= 0 ? list[idx] : { fighterId: order.fighterId, qty: 0, avgUsd: 0, lastUpdated: null }
    const newQty = Number(prev.qty || 0) + Number(order.qty || 0)
    const newAvg = newQty > 0 ? ((Number(prev.avgUsd || 0) * Number(prev.qty || 0) + Number(totalUsd)) / newQty) : Number(totalUsd)
    const updated = { fighterId: order.fighterId, qty: newQty, avgUsd: Number(newAvg.toFixed(2)), lastUpdated: new Date().toISOString() }
    if (idx >= 0) list[idx] = updated; else list.push(updated)
    holdings.set(req.user.id, list)

    const user = users.get(req.user.id)
    const currFV = Number(user?.fvUsd || 0)
    const nextFV = currFV + Number(totalUsd)
    if (user) {
      user.fvUsd = Number(nextFV.toFixed(2))
      user.fanTier = deriveTier(user.fvUsd)
      users.set(user.id, user)
    }

    // Update order status
    order.status = 'minted'
    orders.set(order.id, order)

    // Emit trade ticker event
    const masked = `u_${String(req.user.id).slice(0, 6)}`
    pushTrade({
      type: 'MINT',
      userMasked: masked,
      fighterId: order.fighterId,
      qty: order.qty,
      priceUsd: Number(totalUsd),
      fanTier: user?.fanTier || deriveTier(nextFV),
      ts: Date.now(),
    })

    res.json({ ok: true, receiptId: id, receipt })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Mint failed' })
  }
})

// Get receipt by id (auth; own receipts only)
router.get('/receipts/:id', requireAuth, (req, res) => {
  const r = receipts.get(String(req.params.id))
  if (!r || r.userId !== req.user.id) return res.status(404).json({ error: 'Not found' })
  res.json(r)
})

// Holdings
router.get('/fightfolio/holdings', requireAuth, (req, res) => {
  res.json(holdings.get(req.user.id) || [])
})

// Public trades ticker
router.get('/trades', (req, res) => {
  res.json(TRADES)
})

module.exports = router

