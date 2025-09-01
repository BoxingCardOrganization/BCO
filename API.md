
# BCO API Documentation

## Scripts

### setCap.js
Record fighter attendance and update supply caps.

```bash
node scripts/setCap.js --fighter 123 --attendance 10000 --contract 0x... [--rpc http://127.0.0.1:8545]
```

**Required Environment:**
- `ADMIN_PRIVATE_KEY` or `PRIVATE_KEY`

**Parameters:**
- `--fighter`: Fighter ID number  
- `--attendance`: Attendance count (must be >= previous record)
- `--contract`: FighterCard contract address
- `--rpc`: RPC endpoint (optional)

### signMintAuth.js
Generate EIP-712 signatures for minting authorization.

```bash
node scripts/signMintAuth.js --to 0x... --offer 40 --fighter 555 --contract 0x... --pk 0x...
```

**Parameters:**
- `--to`: Recipient wallet address
- `--offer`: Offer amount in USD (e.g., 40 for $40.00)
- `--fighter`: Fighter ID
- `--contract`: FighterCard contract address  
- `--pk`: Backend signer private key

### mintWithSig.js
Execute minting with a valid signature.

```bash
node scripts/mintWithSig.js --userPk 0x... --sigJson sig.json --contract 0x...
```

**Parameters:**
- `--userPk`: User's private key
- `--sigJson`: Path to signature JSON file
- `--contract`: FighterCard contract address

### quoteMint.js
Get gas and cost estimates for minting.

```bash
node scripts/quoteMint.js --offer 40 --fighter 555 --to 0x... --contract 0x...
```

**Environment Variables:**
- `ETH_USD`: ETH price in USD (default: 3000)
- `SERVICE_FEE_BPS`: Service fee in basis points (default: 500)
- `MINT_GAS_UNITS`: Expected gas units (default: 180000)

## Contract Interfaces

### FighterCard

#### Events
```solidity
event Minted(address indexed to, uint256 indexed tokenId, uint256 indexed fighterId, uint256 offerUsdCents)
event AttendanceRecorded(uint256 indexed fighterId, uint256 attendance)  
event MaxSupplySet(uint256 indexed fighterId, uint256 maxSupply)
event CardValueUpdated(uint256 indexed tokenId, uint256 newValueUsdCents)
event Redeemed(uint256 indexed tokenId)
```

#### Read Functions
```solidity
function getMintPrice(uint256 tokenId) external view returns (uint256)
function getCardValue(uint256 tokenId) external view returns (uint256)
function fighterIdOf(uint256 tokenId) external view returns (uint256)
function isRedeemed(uint256 tokenId) external view returns (bool)
function maxSupplyByFighter(uint256 fighterId) external view returns (uint256)
function mintedByFighter(uint256 fighterId) external view returns (uint256)
function getAttendanceRecord(uint256 fighterId) external view returns (uint256)
```

#### Write Functions (Owner Only)
```solidity
function recordAttendance(uint256 fighterId, uint256 attendance) external onlyOwner
function increaseMaxSupply(uint256 fighterId, uint256 newMaxSupply) external onlyOwner
function setCardValue(uint256 tokenId, uint256 newValueUsdCents) external onlyOwner
function setRedeemed(uint256 tokenId, bool redeemed) external onlyOwner
```

### Fightfolio

```solidity
function getFightfolioValue(address user) external view returns (uint256)
function getOwnedCards(address user) external view returns (uint256[] memory)
function recordCardPurchase(address user, uint256 tokenId) external onlyAdmin
```

### FanTier

```solidity
function getFanTier(address user) external view returns (uint8)
// Returns: 0=Casual, 1=Analyst, 2=Historian, 3=Purist
```

### TradingRing

```solidity
function postMessage(string calldata content) external
function getMessages() external view returns (Message[] memory)
```

## Error Codes

- `"attendance cannot decrease"`: Attempted to reduce fighter's attendance record
- `"can only increase cap"`: Attempted to decrease supply cap  
- `"below minted"`: Cap set below current minted count
- `"sold out"`: Attempted to mint beyond supply cap
- `"bad sig"`: Invalid EIP-712 signature
- `"expired"`: Mint signature past deadline
- `"nonce used"`: Signature replay attempt

## Development Workflow

1. **Start local chain**: `npm run chain`
2. **Deploy contracts**: `npm run deploy`  
3. **Run tests**: `npm test`
4. **Set fighter caps**: Use `setCap.js`
5. **Generate mint sigs**: Use `signMintAuth.js` 
6. **Execute mints**: Use `mintWithSig.js`
