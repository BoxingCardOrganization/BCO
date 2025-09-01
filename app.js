
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = 5000;

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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
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
