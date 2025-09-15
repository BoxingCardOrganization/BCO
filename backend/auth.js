const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { v4: uuidv4 } = require('uuid')
const { users, holdings } = require('./db')
const { ensureUserWallet } = require('./wallet')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const COOKIE_NAME = 'bco_sess'

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET) } catch (_) { return null }
}

async function hashPassword(pw) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(pw, salt)
}

async function checkPassword(pw, hash) {
  return bcrypt.compare(pw, hash)
}

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const decoded = verifyToken(token)
  if (!decoded || !decoded.uid) return res.status(401).json({ error: 'Invalid session' })
  const user = users.get(decoded.uid)
  if (!user) return res.status(401).json({ error: 'User not found' })
  req.user = user
  next()
}

const router = express.Router()
router.use(cookieParser())

router.post('/signup', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const exists = Array.from(users.values()).find(u => String(u.email).toLowerCase() === String(email).toLowerCase())
    if (exists) return res.status(400).json({ error: 'Email already in use' })
    const id = uuidv4()
    const pwHash = await hashPassword(password)
    const user = { id, email, pwHash, createdAt: new Date().toISOString(), wallet: {}, fvUsd: 1250, fanTier: 2 }
    ensureUserWallet(user)
    users.set(id, user)
    holdings.set(id, [])
    const token = signToken({ uid: id })
    res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax' })
    res.json({ id: user.id, email: user.email, wallet: user.wallet, fvUsd: user.fvUsd, fanTier: user.fanTier })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Signup failed' })
  }
})

router.post('/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const user = Array.from(users.values()).find(u => String(u.email).toLowerCase() === String(email).toLowerCase())
    if (!user) return res.status(400).json({ error: 'Invalid credentials' })
    const ok = await checkPassword(password, user.pwHash)
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' })
    const token = signToken({ uid: user.id })
    res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax' })
    res.json({ id: user.id, email: user.email, wallet: user.wallet, fvUsd: user.fvUsd, fanTier: user.fanTier })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Login failed' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME)
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => {
  const u = req.user
  res.json({ id: u.id, email: u.email, fvUsd: u.fvUsd, fanTier: u.fanTier, wallet: u.wallet })
})

module.exports = { router, requireAuth, COOKIE_NAME }

