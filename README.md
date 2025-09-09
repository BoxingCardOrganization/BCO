# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
# BCO

Preview Mode and Full Stack

- MOCK (fastest preview)
  - Windows: `set VITE_MOCK=1 && npm run dev`
  - macOS/Linux: `VITE_MOCK=1 npm run dev`
  - Open http://localhost:3000/preview then navigate to Trading Ring, Fighters, etc.
  - Quick override: add `?mock=1` to URL to force mock; `?mock=0` to disable and reload.

- REAL (full stack)
  - `npm run stack` (runs chain + backend + frontend)
  - Open http://localhost:3000
  - If backend lacks `/api/trades` or `/api/trending` yet, Trending/Ticker will show empty gracefully.
