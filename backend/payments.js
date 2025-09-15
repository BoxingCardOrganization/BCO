const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { orders } = require('./db')
const { requireAuth } = require('./auth')

const router = express.Router()

router.post('/checkout', requireAuth, express.json(), async (req, res) => {
  try {
    const { amountUsd, purpose, fighterId, qty } = req.body || {}
    const amount = Number(amountUsd)
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amountUsd must be a positive number' })
    }
    const purposeStr = String(purpose || '').toLowerCase()
    const orderId = uuidv4()
    const createdAt = new Date().toISOString()

    if (purposeStr === 'mint') {
      const q = Math.max(1, Number(qty || 1))
      const unitPriceUsd = Number((amount / q).toFixed(2))
      const order = { id: orderId, userId: req.user.id, fighterId, qty: q, unitPriceUsd, status: 'created', createdAt }
      orders.set(orderId, order)
    }

    const secret = process.env.STRIPE_SECRET
    if (secret) {
      let stripe
      try { stripe = require('stripe')(secret) } catch (e) { stripe = null }
      if (!stripe) return res.status(500).json({ error: 'Stripe SDK not available' })

      const baseUrl = process.env.APP_BASE || 'http://localhost:3000'
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: purposeStr === 'mint' ? `Mint ${fighterId || ''} x${qty || 1}` : (purpose || 'Payment') },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/success?o=${orderId}`,
        cancel_url: `${baseUrl}/cancel?o=${orderId}`,
        client_reference_id: orderId,
        metadata: { orderId, userId: req.user.id, purpose: purposeStr, fighterId: fighterId || '' },
        payment_intent_data: { metadata: { orderId, userId: req.user.id } },
      })
      const existing = orders.get(orderId)
      if (existing) { existing.stripeSessionId = session.id; orders.set(orderId, existing) }
      return res.json({ ok: true, url: session.url, orderId })
    }

    // Mock: no redirect URL; frontend should proceed accordingly
    return res.json({ ok: true, orderId })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Checkout failed' })
  }
})

module.exports = router

