
# BCO Technical Specification

## Overview

BCO (Boxing Card Organization) is a blockchain-based platform for trading digital fighter cards with real-world utility. Cards represent ownership stakes in fighters and can be redeemed for event tickets.

## Business Rules

### Supply Management
- **Supply Formula**: Maximum supply per fighter = floor(50% of highest recorded headlined attendance)
- **Cap Increases Only**: Supply caps can only increase, never decrease
- **Attendance Tracking**: Historical attendance records are immutable and can only increase

### Pricing & Refunds
- **Refunds**: Always at original mint price minus platform fees
- **No Speculation**: Resale exists for demand signaling, not profit
- **Transparent Pricing**: All prices in USD cents for clarity

### Fan Tiers
- **Casual**: 1.0x multiplier (Fightfolio value < $1.00)
- **Analyst**: 1.2x multiplier (Fightfolio value $1.00-$4.99)  
- **Historian**: 1.5x multiplier (Fightfolio value $5.00-$9.99)
- **Purist**: 2.0x multiplier (Fightfolio value $10.00+)

### Trading Ring Scoring
```
score = log(1 + FightfolioValue) × FanTierMultiplier × exp(-λ × ageSeconds) × (1 + Engagement)
```
- **λ**: Configurable decay constant (default: 0.000001)
- **Engagement**: Optional multiplier based on activity

## Architecture

### Core Contracts

#### FighterCard.sol
- EIP-712 signature-based minting
- Supply cap enforcement
- Pricing and valuation tracking
- Redemption state management

#### Fightfolio.sol  
- Portfolio valuation aggregation
- Weekly value snapshots
- Card ownership tracking

#### FanTier.sol
- Dynamic tier calculation
- Fightfolio value integration

#### TradingRing.sol
- Message posting with scoring
- Fan tier integration
- Time-based ranking

### Key Functions

#### Supply Management
```solidity
function recordAttendance(uint256 fighterId, uint256 attendance) external onlyOwner
function increaseMaxSupply(uint256 fighterId, uint256 newMaxSupply) external onlyOwner
function getAttendanceRecord(uint256 fighterId) external view returns (uint256)
```

#### Minting
```solidity
function mintWithSig(MintAuth calldata m, bytes calldata sig) external returns (uint256)
```

#### Valuation
```solidity
function getFightfolioValue(address user) external view returns (uint256)
function getFanTier(address user) external view returns (uint8)
```

## Security Considerations

- All price operations in USD cents to avoid floating point issues
- Signature replay protection via nonces
- Access control on administrative functions
- Cap increase validation to prevent gaming

## Integration Points

- **Ticketing Partner**: For redemption fulfillment
- **Attendance Data**: For cap calculations  
- **Pricing Oracle**: For weekly valuations
- **Profile Sync**: For fighter metadata

## Testing Strategy

- Unit tests for all core functions
- Integration tests for cross-contract interactions  
- Property-based testing for economic invariants
- Gas optimization testing
