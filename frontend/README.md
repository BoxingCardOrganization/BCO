
# BCO Frontend

React + Vite + Tailwind + React Router frontend for the Boxing Card Organization platform.

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

The development server will start on `http://localhost:3000` with proxying to the Express backend on port 5000.

## Page Architecture & UI Inspiration

Each page draws inspiration from proven financial and sports platforms:

### Home Page (`/`)
**Inspiration: ESPN Fantasy, FanDuel**
- Hero section with clear value proposition
- Fighter card grid with tier filters
- Trading Ring preview
- Call-to-action for onboarding

### Offer Builder (`/offer-builder`)
**Inspiration: PrizePicks, Underdog Fantasy**
- Search and filter fighters
- Add cards to offer slip
- Sticky offer summary with pricing
- Clear refund policy disclaimer
- Confirmation flow

### Fighter Page (`/fighter/:id`)
**Inspiration: Coinbase asset pages**
- Detailed fighter stats and metrics
- Supply progress visualization
- Interactive FAQ accordion
- Clear attendance-based cap explanation

### Trading Ring (`/trading-ring`)
**Inspiration: Sleeper, Public.com**
- Message composer with cost display
- Feed sorted by algorithmic score
- Fan tier indicators
- Engagement actions (like, reply, share)

### Wallet (`/wallet`)
**Inspiration: Cash App, Robinhood**
- Balance display with account info
- Deposit/withdraw modal sheets
- KYC verification checklist
- Transaction history

### Onboarding (`/onboarding`)
**Inspiration: Modern fintech onboarding**
- 3-step guided tour
- Visual explanations of key concepts
- Progress indicator
- Skip option for experienced users

## Component Library

### Core Components
- `NavBar` - Responsive navigation with mobile menu
- `FighterCard` - Reusable fighter display with stats
- `StickyOfferSlip` - Bottom sheet for offer management
- `FighterStatTile` - Metric display with trend indicators

### UI Components
- `PromoStrip` - Notification/announcement banner
- `EmptyState` - Placeholder for empty data
- `Loading` - Spinner with customizable text
- `ErrorState` - Error display with retry action

## Utility Libraries

### `lib/api.js`
- Centralized API client
- RPC proxy for blockchain calls
- Mock data fallbacks for development
- Error handling with custom APIError class

### `lib/scoring.js`
- Trading Ring score calculation
- Fan tier multipliers
- Time decay functions

### `lib/format.js`
- Currency formatting (USD cents)
- Number formatting with localization
- Time ago display
- Address truncation
- Supply progress display

## Business Rules Implementation

### Supply Management
- **50% Rule**: Caps set at 50% of highest attendance
- **Increase Only**: Caps never decrease, only increase
- **Visual Progress**: Supply bars show minted/cap ratio

### Fan Tiers
- **Casual**: 1.0x multiplier (gray)
- **Analyst**: 1.2x multiplier (blue)  
- **Historian**: 1.5x multiplier (purple)
- **Purist**: 2.0x multiplier (orange)

### Trading Ring Scoring
```
Score = log(1 + FV) × FT × exp(-λ×ageSec) × (1 + E)
```
- FV = Fightfolio Value
- FT = Fan Tier multiplier
- λ = Time decay constant
- E = Engagement bonus

### Refund Policy
- Refunds at original mint price only
- Resale represents demand signaling
- Clear disclaimers in offer flow

## Development Features

### Mock Data
All API calls have mock fallbacks for development without backend:
- Fighter profiles with realistic stats
- Trading Ring messages with scores
- Wallet balances and transactions

### Responsive Design
- Mobile-first Tailwind approach
- Sticky navigation and offer slip
- Modal sheets for mobile actions
- Touch-friendly interactions

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance

## Production Considerations

### Performance
- Lazy loading for heavy components
- Optimized bundle splitting
- Image optimization for fighter photos
- CDN-ready static assets

### Security
- API calls through proxy only
- No direct RPC exposure
- Input validation and sanitization
- Secure credential handling

### Monitoring
- Error boundary implementation
- Analytics event tracking
- Performance monitoring
- User journey tracking

## API Integration

The frontend communicates with the Express backend through:
- `/api/*` routes for application data
- `/rpc` endpoint for blockchain calls
- WebSocket connections for real-time updates (future)
- Authentication headers for user sessions

All blockchain interactions are proxied through the backend to ensure consistent error handling and response formatting.
