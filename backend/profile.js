const express = require('express')
const { requireAuth } = require('./auth')

function deriveTier(fvUsd) {
  const v = Number(fvUsd || 0)
  if (v >= 10000) return 4
  if (v >= 2500) return 3
  if (v >= 500) return 2
  return 1
}

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  const u = req.user
  const fightfolioValue = Number(u.fvUsd || 0)
  const fanTier = deriveTier(fightfolioValue)
  res.json({ fightfolioValue, fanTier, email: u.email, wallet: { depositAddress: u.wallet?.depositAddress } })
})

module.exports = router

