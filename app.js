
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

// Load .env if present
try { require('dotenv').config(); } catch (_) {}

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware for JSON parsing
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON:', err.message);
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    next();
});

// Serve static files
app.use(express.static('.'));

// Auth and Profile routes
try {
  const { router: authRouter } = require('./backend/auth')
  const profileRouter = require('./backend/profile')
  app.use('/api/auth', authRouter)
  app.use('/api/profile', profileRouter)
} catch (e) {
  console.warn('Auth/Profile routes not initialized:', e?.message)
}

// Payments and webhooks
try {
  const paymentsRouter = require('./backend/payments')
  const { handleStripeWebhook } = require('./backend/webhooks')
  app.use('/api/payments', paymentsRouter)
  // Stripe webhook needs raw body for signature verification
  app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook)
} catch (e) {
  console.warn('Payments routes not initialized:', e?.message)
}

// Mints, receipts, holdings, trades
try {
  const mintsRouter = require('./backend/mints')
  // Mount under /api to provide /api/mints, /api/mints/quote, /api/receipts/:id, /api/fightfolio/holdings, /api/trades
  app.use('/api', mintsRouter)
} catch (e) {
  console.warn('Mints routes not initialized:', e?.message)
}

// Utility: load fighter data with field normalization
function normalizeFighter(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') return null;
  // Accept various shapes and map to required fields
  const id = String(
    raw.id ?? raw.slug ?? raw.uuid ?? fallbackId ?? raw.name ?? Math.random().toString(36).slice(2)
  );
  const name = raw.name ?? raw.fighterName ?? raw.title ?? 'Unknown Fighter';
  const fighterTier = (typeof raw.fighterTier === 'string'
    ? raw.fighterTier
    : raw.fighterTier?.value) ?? raw.tier ?? 'Fringe Contender';
  const valuation = Number(
    raw.valuation ?? raw.currentFV ?? raw.currentValuation ?? raw.fightfolioValue ?? raw.FV ?? 0
  );
  const prevValuation = Number(
    raw.prevValuation ?? raw.previousFV ?? raw.lastWeekFV ?? raw.prevFV ?? 0
  );
  const stats = raw.stats ?? raw.keyStats ?? {};
  const news = Array.isArray(raw.news) ? raw.news : [];
  const titles = Array.isArray(raw.titles)
    ? raw.titles.filter(Boolean).map(String)
    : [];

  const attendanceSourceUrl = typeof raw.attendanceSourceUrl === 'string' ? raw.attendanceSourceUrl : ''

  const base = {
    id,
    name,
    fighterTier,
    valuation,
    prevValuation,
    stats,
    news,
    titles,
    attendanceSourceUrl,
  };
  return { ...base, deltaFV: valuation - prevValuation, titlesCount: titles.length };
}

function readFightersFile() {
  const dataPath = path.join(__dirname, 'data', 'fighterprofile.json');
  try {
    if (!fs.existsSync(dataPath)) {
      // Create minimal valid example as an array
      const example = [
        {
          id: 'example-1',
          name: 'Example Fighter',
          fighterTier: 'A-Level Draw',
          valuation: 4200,
          prevValuation: 3900,
          stats: {
            highestTicketsSold: 18000,
            highestGate: 12500000,
            cardsSoldByBCO: 4300
          },
          news: [
            { title: 'Training camp update', url: 'https://example.com/news', date: '2025-07-24' }
          ]
        }
      ];
      fs.writeFileSync(dataPath, JSON.stringify(example, null, 2));
    }
    const text = fs.readFileSync(dataPath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const err = new Error('Invalid JSON in data/fighterprofile.json');
      err.cause = e;
      err.statusCode = 500;
      throw err;
    }

    // Support array or object map. When object, include key as id fallback.
    let items = [];
    if (Array.isArray(parsed)) {
      items = parsed.map((v) => [undefined, v]);
    } else if (parsed && typeof parsed === 'object') {
      items = Object.entries(parsed);
    }
    const normalized = items
      .map(([key, value]) => normalizeFighter(value, key))
      .filter(Boolean)
      .map((f) => ({ ...f, deltaFV: Number(f.valuation) - Number(f.prevValuation), titles: Array.isArray(f.titles) ? f.titles : [], titlesCount: Array.isArray(f.titles) ? f.titles.length : 0 }));
    return normalized;
  } catch (err) {
    throw err;
  }
}

// === Fighter News storage helpers ===
function readNewsFile() {
  const newsPath = path.join(__dirname, 'data', 'fighternews.json');
  try {
    if (!fs.existsSync(newsPath)) {
      fs.writeFileSync(newsPath, JSON.stringify({}, null, 2));
    }
    const text = fs.readFileSync(newsPath, 'utf8');
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return parsed;
    return {};
  } catch (e) {
    return {};
  }
}

function writeNewsFile(obj) {
  const newsPath = path.join(__dirname, 'data', 'fighternews.json');
  fs.writeFileSync(newsPath, JSON.stringify(obj || {}, null, 2));
}

function isValidNewsType(t) { return t === 'article' || t === 'video' }
function parseDate(input) {
  if (!input) return null;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function isAdmin(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true; // If not configured, allow for local dev
  return (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) === token;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Fighters list: light payload sorted by weekly deltaFV desc
app.get('/api/fighters', (req, res) => {
  try {
    const fighters = readFightersFile();
    const light = fighters
      .map(({ id, name, fighterTier, valuation, prevValuation, deltaFV, titles, titlesCount }) => ({
        id,
        name,
        fighterTier,
        valuation,
        prevValuation,
        deltaFV,
        titles,
        titlesCount,
      }))
      .sort((a, b) => Number(b.deltaFV) - Number(a.deltaFV));
    res.json(light);
  } catch (e) {
    const msg = e?.message || 'Failed to load fighters';
    res.status(e.statusCode || 500).json({ error: msg });
  }
});

// Simple messages API for Trading Ring
const __messages = []
app.get('/api/messages', (req, res) => {
  res.json(__messages)
})

app.post('/api/messages', (req, res) => {
  const { feeUsd } = req.body || {}
  const amt = Number(feeUsd)
  if (!Number.isFinite(amt) || Number(amt.toFixed(2)) !== 1.0) {
    return res.status(400).json({ error: 'Invalid posting fee. Expected 1.00 USD.' })
  }
  const now = Date.now()
  const msg = {
    id: now,
    timestamp: now,
    content: req.body?.content,
    author: req.body?.author || '0xSERVER...DEMO',
    fanTier: req.body?.fanTier || 1,
    fightfolioValue: req.body?.fightfolioValue || 0,
    score: req.body?.score || 0,
  }
  __messages.unshift(msg)
  res.json(msg)
})

// Fighter detail: full object including stats/news and computed deltaFV
app.get('/api/fighters/:id', (req, res) => {
  try {
    const fighters = readFightersFile();
    const fighter = fighters.find((f) => String(f.id) === String(req.params.id));
    if (!fighter) return res.status(404).json({ error: 'Fighter not found' });
    res.json(fighter);
  } catch (e) {
    const msg = e?.message || 'Failed to load fighter';
    res.status(e.statusCode || 500).json({ error: msg });
  }
});

// Fighter News: GET list
app.get('/api/fighters/:id/news', (req, res) => {
  try {
    const id = String(req.params.id)
    const store = readNewsFile()
    const list = Array.isArray(store[id]) ? store[id] : []
    const sorted = [...list].sort((a,b)=>{
      const da = new Date(a.publishedAt).getTime() || 0
      const db = new Date(b.publishedAt).getTime() || 0
      return db - da
    })
    res.json(sorted)
  } catch (e) {
    res.status(500).json({ error: 'Failed to load news' })
  }
})

// Admin: Create news item
app.post('/api/admin/fighters/:id/news', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const id = String(req.params.id)
  const { type, title, url, publishedAt } = req.body || {}
  if (!isValidNewsType(type)) return res.status(400).json({ error: "type must be 'article' or 'video'" })
  if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title is required' })
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'url must be http(s)' })
  const d = parseDate(publishedAt)
  if (!d) return res.status(400).json({ error: 'publishedAt must be epoch ms or ISO date' })

  const store = readNewsFile()
  const list = Array.isArray(store[id]) ? store[id] : []
  const item = { id: String(Date.now()), type, title, url, publishedAt: d.toISOString() }
  list.push(item)
  store[id] = list
  writeNewsFile(store)
  res.json(item)
})

// Admin: Update news item
app.patch('/api/admin/fighters/:id/news/:newsId', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const id = String(req.params.id)
  const newsId = String(req.params.newsId)
  const store = readNewsFile()
  const list = Array.isArray(store[id]) ? store[id] : []
  const idx = list.findIndex(n => String(n.id) === newsId)
  if (idx === -1) return res.status(404).json({ error: 'News item not found' })

  const patch = req.body || {}
  if (patch.type !== undefined && !isValidNewsType(patch.type)) return res.status(400).json({ error: "type must be 'article' or 'video'" })
  if (patch.title !== undefined && (!patch.title || typeof patch.title !== 'string')) return res.status(400).json({ error: 'title must be non-empty string' })
  if (patch.url !== undefined && (typeof patch.url !== 'string' || (patch.url && !/^https?:\/\//i.test(patch.url)))) return res.status(400).json({ error: 'url must be http(s)' })
  if (patch.publishedAt !== undefined) {
    const d = parseDate(patch.publishedAt)
    if (!d) return res.status(400).json({ error: 'publishedAt must be epoch ms or ISO date' })
    patch.publishedAt = d.toISOString()
  }

  const updated = { ...list[idx], ...patch }
  list[idx] = updated
  store[id] = list
  writeNewsFile(store)
  res.json(updated)
})

// Admin: Delete news item
app.delete('/api/admin/fighters/:id/news/:newsId', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' })
  const id = String(req.params.id)
  const newsId = String(req.params.newsId)
  const store = readNewsFile()
  const list = Array.isArray(store[id]) ? store[id] : []
  const next = list.filter(n => String(n.id) !== newsId)
  store[id] = next
  writeNewsFile(store)
  res.json({ ok: true })
})

// Admin: update fighter fields (currently supports attendanceSourceUrl)
app.patch('/api/admin/fighters/:id', (req, res) => {
  const id = String(req.params.id)
  const { attendanceSourceUrl } = req.body || {}

  // Validate URL: allow empty string or http(s)
  if (typeof attendanceSourceUrl !== 'undefined') {
    if (attendanceSourceUrl !== '' && typeof attendanceSourceUrl !== 'string') {
      return res.status(400).json({ error: 'attendanceSourceUrl must be a string' })
    }
    if (attendanceSourceUrl && !/^https?:\/\//i.test(attendanceSourceUrl)) {
      return res.status(400).json({ error: 'attendanceSourceUrl must start with http:// or https://' })
    }
  }

  const dataPath = path.join(__dirname, 'data', 'fighterprofile.json')
  try {
    const rawText = fs.readFileSync(dataPath, 'utf8')
    const parsed = JSON.parse(rawText)

    let found = false
    if (Array.isArray(parsed)) {
      for (let i = 0; i < parsed.length; i++) {
        const f = parsed[i]
        if (String(f?.id) === id) {
          if (typeof attendanceSourceUrl !== 'undefined') parsed[i].attendanceSourceUrl = attendanceSourceUrl
          found = true
          break
        }
      }
    } else if (parsed && typeof parsed === 'object') {
      // Object map; try direct key or search values
      if (parsed[id]) {
        if (typeof attendanceSourceUrl !== 'undefined') parsed[id].attendanceSourceUrl = attendanceSourceUrl
        found = true
      } else {
        for (const key of Object.keys(parsed)) {
          if (String(parsed[key]?.id) === id) {
            if (typeof attendanceSourceUrl !== 'undefined') parsed[key].attendanceSourceUrl = attendanceSourceUrl
            found = true
            break
          }
        }
      }
    }

    if (!found) return res.status(404).json({ error: 'Fighter not found' })

    fs.writeFileSync(dataPath, JSON.stringify(parsed, null, 2))

    // Return updated fighter
    const fighters = readFightersFile();
    const fighter = fighters.find((f) => String(f.id) === id)
    return res.json(fighter)
  } catch (e) {
    const msg = e?.message || 'Failed to update fighter'
    return res.status(500).json({ error: msg })
  }
})

// JSON-RPC proxy to Hardhat node
app.post('/rpc', async (req, res) => {
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    
    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.text();
        
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            // If response isn't valid JSON, return a JSON-RPC error
            res.json({
                jsonrpc: '2.0',
                id: req.body.id || null,
                error: {
                    code: -32700,
                    message: 'Parse error: Invalid response from RPC server',
                    data: { originalResponse: data }
                }
            });
        }
    } catch (error) {
        // Network or other errors
        res.json({
            jsonrpc: '2.0',
            id: req.body.id || null,
            error: {
                code: -32603,
                message: 'Internal error: Cannot connect to RPC server',
                data: { error: error.message }
            }
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to check if Hardhat is running
app.get('/api/status', async (req, res) => {
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    
    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            res.json({ hardhat: true, status: 'Hardhat node is running', blockNumber: data.result });
        } else {
            res.json({ hardhat: false, status: 'Hardhat node not responding' });
        }
    } catch (error) {
        res.json({ hardhat: false, status: 'Cannot connect to Hardhat node', error: error.message });
    }
});

// Handle 404s with JSON response
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🥊 BCO Platform running at http://0.0.0.0:${PORT}`);
    console.log(`📱 Frontend: http://0.0.0.0:${PORT}`);
    console.log(`🔗 RPC Proxy: http://0.0.0.0:${PORT}/rpc`);
    console.log(`❤️ Health Check: http://0.0.0.0:${PORT}/api/health`);
});
