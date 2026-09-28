# Signal Edge — Institutional XAU/USD Trading Intelligence Platform

> **A deterministic, multi-timeframe trading signal platform built specifically for XAU/USD (Gold Spot vs US Dollar) based on Smart Money Concepts (SMC), Supply & Demand, and Market Structure.**

---

## 1. System Vision & Architecture

The primary purpose of **Signal Edge** is to assist discretionary traders with institutional-grade discipline. It eliminates emotional and subjective errors through a strictly deterministic, rules-based, non-repainting decision pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SIGNAL DECISION PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. 4-Hour Timeframe  │ Evaluates external market structure (HH/HL or LH/LL)             │
│                      │ Outputs Directional Bias: BULLISH, BEARISH, or NEUTRAL           │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 2. 15-Minute Setup   │ Identifies Key Supply & Demand Zones & Resting Liquidity Pools   │
│                      │ Verifies Liquidity Sweeps and Displacement (ATR × 1.25, Body>60%)│
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 3. Confirmation Gate │ Evaluates Closed-Candle Patterns (Engulfing, Pin Bar Rejection)  │
│                      │ Validates Risk:Reward Ratio (Minimum 1:2.0 to TP2)               │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 4. Safeguard Filters │ Session filter (London, NY, Overlap) & Macro Blackout Filter     │
│                      │ Stale Data Feed Gate (freezes signals if data is outdated)       │
├──────────────────────┼──────────────────────────────────────────────────────────────────┤
│ 5. Actionable Signal │ STRONG_BUY / BUY / WAIT / SELL / STRONG_SELL / NO_TRADE          │
│                      │ Accompanied by exact Entry, Stop Loss, TP1/TP2/TP3, & Rationale  │
└──────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Pillars & Capabilities

1. **Deterministic Rules-Based Engine**:
   - Zero black-box AI predictions. Every single signal is calculated from explicit mathematical rules.
   - Closed-candle confirmation only: signals never repaint after confirmation.
   - Conservative default: produces **`NO_TRADE`** or **`WAIT`** most of the time to avoid overtrading.

2. **Real Market Data with Failover**:
   - Live Gold (`XAU/USD`), Dollar Index (`DXY`), Bitcoin (`BTC/USD`), and Equities via direct financial market quote feeds.
   - Built-in `LiveMarketProvider` with automatic fallback to high-fidelity `DemoDataProvider` if offline.
   - Visible data source and stale status indicator: `XAU/USD · LIVE · YahooFinance` or `XAU/USD · SIMULATED DEMO`.

3. **TradingView Lightweight Charts**:
   - Interactive candlestick chart with dynamic timeframe switching (`1M`, `5M`, `15M`, `30M`, `1H`, `4H`, `1D`).
   - Real-time overlay lines: Blue Entry Line, Red Stop Loss Line, Green Target Lines (TP1, TP2, TP3), and Supply/Demand boundaries.

4. **Multi-Timeframe Setup Checklist**:
   - Tracks 9 independent confirmation gates:
     1. 4H Trend
     2. 4H Structure
     3. Key Supply/Demand Zone
     4. Liquidity Sweep
     5. 15M Structure (CHOCH / BOS)
     6. Displacement (ATR multiple & body ratio)
     7. Order Block Retest
     8. Closed Candle Confirmation
     9. Minimum 1:2.0 Risk/Reward Check

5. **Inter-Market DXY & Macro Calendar Intelligence**:
   - Live tracking of US Dollar Index (DXY) and US 10-Yr Treasury Yields.
   - Rolling macro economic calendar tracking US FOMC, US CPI, and Non-Farm Payrolls (NFP).
   - Dynamic volatility risk penalties and 15-minute pre/post event blackout windows.

6. **Chronological Replay Backtester**:
   - Evaluates historical candles step-by-step with **strict anti-lookahead guarantees**.
   - Realistic execution modeling: incorporates spread, slippage, and conservative same-bar tie-breaking (assumes stop was hit first if both SL and TP are touched on the same bar).
   - Generates Win Rate, Profit Factor, Expectancy, Max Drawdown, and full trade-by-trade audit log.

7. **Trader Execution Journal**:
   - Manual trade logging linked directly to platform-generated signals.
   - Tracks psychological mindset (Disciplined, FOMO, Hesitant, Greedy) and Rule Discipline Scores (1-10).

---

## 3. Quick Start & Execution

### Prerequisites
- Node.js 18+ (Node 20 recommended)
- SQLite (zero configuration, runs locally out of the box)

### Installation
```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Setup SQLite Database & Prisma Client
npx prisma generate
npx prisma db push

# 3. Seed historical data & default instruments
npx tsx prisma/seed.ts

# 4. Run Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 4. Running Tests

The platform includes comprehensive test suites covering non-repainting guarantees, anti-lookahead protection, BOS/CHOCH transitions, supply/demand detection, and signal scenarios:

```bash
npm test
```

All 17 unit tests run in Vitest:
- `swing-detection.test.ts`: Confirmed fractals, non-repainting unclosed bar checks.
- `market-structure.test.ts`: BOS and CHOCH state transitions.
- `zones.test.ts`: Base candle detection and displacement impulse.
- `anti-lookahead.test.ts`: Proves future bars cannot alter historical signals.
- `signal-engine.test.ts`: Stale data gate, macro blackout gate, bullish/bearish bias.
- `backtester.test.ts`: Chronological replay and pessimistic same-bar tie-breaking.

---

## 5. Production Docker Deployment

Deploy with Docker Compose:
```bash
docker compose up -d --build
```
The application will be accessible at `http://localhost:3000`.

---

## 6. Architecture & File Structure

```
trading-signal-platform/
├── prisma/
│   ├── schema.prisma          # Database models (Instruments, Signals, Backtests, Journal)
│   ├── seed.ts                # Realistic XAU/USD data & settings seeder
│   └── dev.db                 # SQLite database file
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API route handlers
│   │   │   ├── analysis/current/route.ts  # Real-time multi-timeframe signal evaluation
│   │   │   ├── backtest/route.ts          # Chronological backtest execution
│   │   │   ├── health/route.ts            # System health and latency monitor
│   │   │   ├── journal/route.ts           # Trade journal endpoints
│   │   │   ├── market/bars/route.ts       # OHLC historical candlestick bars
│   │   │   ├── market/quote/route.ts      # Live financial quotes
│   │   │   ├── settings/route.ts          # Strategy parameters
│   │   │   └── signals/route.ts           # Signal audit trail
│   │   ├── backtest/page.tsx  # Interactive Backtesting UI
│   │   ├── journal/page.tsx   # Trade Journal & Psychology Tracker
│   │   ├── settings/page.tsx  # Platform & Risk Configuration
│   │   ├── signals/page.tsx   # Filterable Signal History
│   │   ├── signals/[id]/page.tsx # Detailed Signal Audit Record
│   │   ├── strategy/page.tsx  # Strategy Documentation Specification
│   │   ├── layout.tsx         # Dark theme layout with Inter font
│   │   └── page.tsx           # Main Trading Station Dashboard
│   ├── components/
│   │   ├── chart/
│   │   │   └── TradingChart.tsx   # TradingView Lightweight Charts
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx      # Main workspace grid
│   │   │   ├── Header.tsx         # Dual UTC/IST clocks, session, data source
│   │   │   ├── Watchlist.tsx      # Multi-asset watchlist
│   │   │   ├── MarketContext.tsx  # DXY, 10Y Yields, Macro countdown
│   │   │   └── DataHealth.tsx     # Latency & database health status
│   │   └── signals/
│   │       ├── SignalCard.tsx     # Large primary signal intelligence card
│   │       ├── SetupChecklist.tsx # 9-step confirmation progress checklist
│   │       └── SignalHistory.tsx  # Recent execution audit list
│   ├── hooks/
│   │   ├── useMarketData.ts   # Live candlesticks & quote polling
│   │   ├── useSignalEngine.ts # Live deterministic signal evaluation
│   │   └── useDataHealth.ts   # Latency & connection monitoring
│   └── lib/
│       ├── engine/
│       │   ├── atr.ts                 # True range & volatility
│       │   ├── backtester.ts          # Chronological replay engine
│       │   ├── bias.ts                # 4H directional bias
│       │   ├── candlestick-patterns.ts# Engulfing & pin bar confirmation
│       │   ├── displacement.ts        # ATR multiple & body ratio
│       │   ├── fvg.ts                 # Fair value gap detection
│       │   ├── global-context.ts      # DXY & inter-market correlation
│       │   ├── liquidity.ts           # Buy/sell-side liquidity sweeps
│       │   ├── macro-calendar.ts      # FOMC/CPI/NFP calendar & blackout
│       │   ├── market-structure.ts    # HH/HL/LH/LL, BOS, CHOCH
│       │   ├── risk.ts                # Position sizing & R:R calculator
│       │   ├── session.ts             # Asia/London/NY session filters
│       │   ├── signal-engine.ts       # Central deterministic evaluation
│       │   ├── swing-detection.ts     # Non-repainting fractals
│       │   └── zones.ts               # Supply/Demand detection & quality
│       ├── providers/
│       │   ├── live-provider.ts       # Live spot/futures market data
│       │   ├── demo-provider.ts       # High-fidelity simulation fallback
│       │   └── provider-manager.ts    # Failover & health manager
│       └── types/
│           ├── market.ts              # Candle, Quote, Timeframe, Session types
│           └── strategy.ts            # Signal, Zone, Checklist, Backtest types
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## 7. License

Proprietary trading software designed for discretionary traders utilizing institutional Smart Money Concepts (SMC).
