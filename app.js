
const express = require('express');
const cors = require('cors');
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

  const base = {
    id,
    name,
    fighterTier,
    valuation,
    prevValuation,
    stats,
    news,
    titles,
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
