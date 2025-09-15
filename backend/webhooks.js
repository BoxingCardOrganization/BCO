const { orders } = require('./db')

function getStripe() {
  const secret = process.env.STRIPE_SECRET
  if (!secret) return null
  try { return require('stripe')(secret) } catch (_) { return null }
}

async function handleStripeWebhook(req, res) {
  const stripe = getStripe()
  let event
  try {
    const sig = req.headers['stripe-signature']
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (stripe && whSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, whSecret)
    } else {
      // Treat body as JSON (Express raw gives Buffer)
      const text = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body||{}))
      event = JSON.parse(text)
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object || {}
        const orderId = session?.metadata?.orderId || session?.client_reference_id
        if (orderId && orders.has(orderId)) {
          const o = orders.get(orderId)
          o.status = 'paid'
          o.stripePaymentId = session.payment_intent || o.stripePaymentId
          o.stripeSessionId = session.id || o.stripeSessionId
          orders.set(orderId, o)
        }
        break
      }
      case 'payment_intent.succeeded': {
        const pi = event.data?.object || {}
        const orderId = pi?.metadata?.orderId
        if (orderId && orders.has(orderId)) {
          const o = orders.get(orderId)
          o.status = 'paid'
          o.stripePaymentId = pi.id
          orders.set(orderId, o)
        }
        break
      }
      default:
        break
    }
  } catch (_) {}

  res.json({ received: true })
}

module.exports = { handleStripeWebhook }

