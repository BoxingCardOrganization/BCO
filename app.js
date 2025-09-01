
const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// Middleware for parsing JSON (with error handling)
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

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to check if Hardhat is running
app.get('/api/status', async (req, res) => {
    try {
        const response = await fetch('http://127.0.0.1:8545', {
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
            res.json({ hardhat: true, status: 'Hardhat node is running' });
        } else {
            res.json({ hardhat: false, status: 'Hardhat node not responding' });
        }
    } catch (error) {
        res.json({ hardhat: false, status: 'Cannot connect to Hardhat node' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🥊 BCO Platform running at http://0.0.0.0:${PORT}`);
    console.log(`📱 Frontend: http://0.0.0.0:${PORT}`);
    console.log(`🔗 Hardhat RPC: http://127.0.0.1:8545`);
});
