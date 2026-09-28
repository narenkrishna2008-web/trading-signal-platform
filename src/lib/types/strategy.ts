/**
 * Strategy and signal types for the trading signal platform.
 * These types define the complete signal lifecycle, scoring, and configuration.
 */

import { type Timeframe, type MarketSession, type Candle } from './market';

// ─── Market Structure ────────────────────────────────────────────────────────

export type SwingType = 'SWING_HIGH' | 'SWING_LOW';
export type StructureType = 'HH' | 'HL' | 'LH' | 'LL';
export type StructureBreakType = 'BOS' | 'CHOCH';
export type StructureLevel = 'INTERNAL' | 'EXTERNAL';

export interface SwingPoint {
  type: SwingType;
  price: number;
  timestamp: number;
  candleIndex: number;
  confirmed: boolean;
  leftBars: number;
  rightBars: number;
}

export interface StructureEvent {
  type: StructureBreakType;
  structureType: StructureType;
  level: StructureLevel;
  direction: 'BULLISH' | 'BEARISH';
  breakPrice: number;
  referencePrice: number;
  timestamp: number;
  candleIndex: number;
  confirmed: boolean;
}

// ─── Directional Bias ────────────────────────────────────────────────────────

export type DirectionalBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface BiasAssessment {
  bias: DirectionalBias;
  confidence: number; // 0-100
  reasons: string[];
  structureEvents: StructureEvent[];
  lastSwingHigh: SwingPoint | null;
  lastSwingLow: SwingPoint | null;
  timestamp: number;
}

// ─── Supply / Demand Zones ───────────────────────────────────────────────────

export type ZoneType = 'SUPPLY' | 'DEMAND';
export type ZoneStyle = 'FULL_WICK' | 'CANDLE_BODY' | 'BASE_RANGE';
export type ZoneState = 'FRESH' | 'TESTED' | 'BROKEN' | 'MITIGATED';

export interface Zone {
  id: string;
  type: ZoneType;
  high: number;
  low: number;
  timeframe: Timeframe;
  createdAt: number; // Timestamp
  candleIndex: number;
  quality: ZoneQuality;
  touches: number;
  state: ZoneState;
  style: ZoneStyle;
  sourceCandles: Candle[];
}

export interface ZoneQuality {
  score: number; // 0-100
  factors: ZoneQualityFactor[];
}

export interface ZoneQualityFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

// ─── Fair Value Gap ──────────────────────────────────────────────────────────

export type FVGType = 'BULLISH' | 'BEARISH';

export interface FairValueGap {
  id: string;
  type: FVGType;
  high: number;
  low: number;
  timestamp: number;
  candleIndex: number;
  timeframe: Timeframe;
  gapSize: number;
  filled: boolean;
  fillPercentage: number;
}

// ─── Liquidity ───────────────────────────────────────────────────────────────

export type LiquidityType = 'BUY_SIDE' | 'SELL_SIDE';
export type LiquiditySource =
  | 'SWING_HIGH'
  | 'SWING_LOW'
  | 'EQUAL_HIGHS'
  | 'EQUAL_LOWS'
  | 'SESSION_HIGH'
  | 'SESSION_LOW'
  | 'PREVIOUS_DAY_HIGH'
  | 'PREVIOUS_DAY_LOW'
  | 'PREVIOUS_WEEK_HIGH'
  | 'PREVIOUS_WEEK_LOW';

export type LiquidityState = 'RESTING' | 'SWEPT' | 'INVALIDATED';

export interface LiquidityLevel {
  id: string;
  type: LiquidityType;
  source: LiquiditySource;
  price: number;
  timestamp: number;
  state: LiquidityState;
  sweptAt?: number;
  strength: number; // 0-100
}

export interface LiquiditySweep {
  id: string;
  liquidityLevel: LiquidityLevel;
  sweepTimestamp: number;
  sweepPrice: number;
  rejectionConfirmed: boolean;
  structureShiftConfirmed: boolean;
}

// ─── Displacement ────────────────────────────────────────────────────────────

export interface DisplacementEvent {
  direction: 'BULLISH' | 'BEARISH';
  candle: Candle;
  atrMultiple: number;
  bodyRatio: number;
  structureBreak: boolean;
  timestamp: number;
  confirmed: boolean;
}

// ─── Candlestick Patterns ────────────────────────────────────────────────────

export type CandlePattern =
  | 'BULLISH_ENGULFING'
  | 'BEARISH_ENGULFING'
  | 'BULLISH_PIN_BAR'
  | 'BEARISH_PIN_BAR'
  | 'STRONG_BULLISH_BODY'
  | 'STRONG_BEARISH_BODY'
  | 'INSIDE_BAR';

export interface CandlePatternEvent {
  pattern: CandlePattern;
  direction: 'BULLISH' | 'BEARISH';
  timestamp: number;
  candleIndex: number;
  candle: Candle;
  previousCandle?: Candle;
}

// ─── Setup Types ─────────────────────────────────────────────────────────────

export type SetupType =
  | 'BREAKOUT_CONTINUATION'
  | 'REVERSAL'
  | 'DEMAND_RETEST'
  | 'SUPPLY_RETEST';

export type SetupStatus =
  | 'FORMING'
  | 'DETECTED'
  | 'WAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'INVALIDATED';

// ─── Signal Types ────────────────────────────────────────────────────────────

export type SignalDirection = 'BUY' | 'SELL';

export type SignalStatus =
  | 'STRONG_BUY'
  | 'BUY'
  | 'WAIT'
  | 'SELL'
  | 'STRONG_SELL'
  | 'NO_TRADE'
  | 'DATA_STALE'
  | 'MARKET_UNAVAILABLE';

export type SignalLifecycle =
  | 'DETECTED'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PARTIAL'
  | 'TP1_HIT'
  | 'TP2_HIT'
  | 'TP3_HIT'
  | 'STOP_HIT'
  | 'INVALIDATED'
  | 'EXPIRED'
  | 'CANCELLED';

export type SignalQualityTier = 'HIGH_CONFLUENCE' | 'VALID' | 'WATCH' | 'NO_TRADE';

// ─── Signal Reason ───────────────────────────────────────────────────────────

export type ReasonCategory =
  | 'HTF_STRUCTURE'
  | 'ZONE'
  | 'LIQUIDITY'
  | 'STRUCTURE'
  | 'DISPLACEMENT'
  | 'CONFIRMATION'
  | 'RISK'
  | 'CONTEXT';

export interface SignalReason {
  category: ReasonCategory;
  passed: boolean;
  message: string;
  weight: number;
  score: number;
}

// ─── Signal Result ───────────────────────────────────────────────────────────

export interface SignalResult {
  id: string;
  status: SignalStatus;
  direction: SignalDirection | null;
  symbol: string;
  higherTimeframe: Timeframe;
  executionTimeframe: Timeframe;
  setupType: SetupType | null;
  timestamp: number;
  entry: number | null;
  stopLoss: number | null;
  takeProfits: TakeProfitLevel[];
  riskReward: number | null;
  invalidationPrice: number | null;
  invalidationCondition: string | null;
  expiryTimestamp: number | null;
  expiryCandles: number | null;
  confidence: number; // 0-100
  qualityTier: SignalQualityTier;
  reasons: SignalReason[];
  warnings: string[];
  lifecycle: SignalLifecycle;
  strategyVersion: string;
  dataSource: string;
  // Market context snapshot
  htfBias: BiasAssessment | null;
  activeZone: Zone | null;
  activeLiquiditySweep: LiquiditySweep | null;
  structureEvent: StructureEvent | null;
  displacement: DisplacementEvent | null;
  candleConfirmation: CandlePatternEvent | null;
  currentSession: MarketSession | null;
}

export interface TakeProfitLevel {
  level: number; // 1, 2, 3
  price: number;
  rMultiple: number;
  description: string;
}

// ─── Setup Checklist ─────────────────────────────────────────────────────────

export interface SetupChecklist {
  htfTrend: ChecklistItem;
  htfStructure: ChecklistItem;
  keyZone: ChecklistItem;
  liquidity: ChecklistItem;
  ltfStructure: ChecklistItem;
  displacement: ChecklistItem;
  retest: ChecklistItem;
  candleConfirmation: ChecklistItem;
  riskCheck: ChecklistItem;
  signalStatus: SignalStatus;
}

export interface ChecklistItem {
  label: string;
  status: 'PASSED' | 'WAITING' | 'FAILED' | 'NA';
  detail: string;
}

// ─── Strategy Configuration ──────────────────────────────────────────────────

export interface StrategyConfig {
  version: string;
  higherTimeframe: Timeframe;
  executionTimeframe: Timeframe;

  swingDetection: {
    leftBars: number;
    rightBars: number;
  };

  displacement: {
    atrPeriod: number;
    atrMultiple: number;
    minimumBodyRatio: number;
  };

  zones: {
    maxWidthAtr: number;
    minDisplacementAtr: number;
    style: ZoneStyle;
    maxTouches: number;
    qualityThreshold: number;
  };

  fvg: {
    enabled: boolean;
    minGapAtr: number;
  };

  liquidity: {
    equalityToleranceAtr: number;
    sweepBufferAtr: number;
    lookbackBars: number;
  };

  breakout: {
    closeBufferAtr: number;
    requireRetest: boolean;
    maxRetestBars: number;
  };

  reversal: {
    requireLiquiditySweep: boolean;
    requireStructureShift: boolean;
    requireDisplacement: boolean;
  };

  risk: {
    minimumRR: number;
    stopBufferAtr: number;
  };

  signal: {
    minimumScore: number;
    highConfluenceScore: number;
    maxExpiryBars: number;
    maxConcurrentSignals: number;
  };

  session: {
    enabled: boolean;
    allowedSessions: MarketSession[];
    blackoutBeforeEventMinutes: number;
    blackoutAfterEventMinutes: number;
  };

  scoring: {
    weights: Record<ReasonCategory, number>;
  };
}

// ─── Default Strategy Configuration ──────────────────────────────────────────

export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  version: 'XAU-SMC-1.0.0',
  higherTimeframe: '4H',
  executionTimeframe: '15M',

  swingDetection: {
    leftBars: 2,
    rightBars: 2,
  },

  displacement: {
    atrPeriod: 14,
    atrMultiple: 1.25,
    minimumBodyRatio: 0.60,
  },

  zones: {
    maxWidthAtr: 2.0,
    minDisplacementAtr: 1.5,
    style: 'FULL_WICK',
    maxTouches: 3,
    qualityThreshold: 50,
  },

  fvg: {
    enabled: true,
    minGapAtr: 0.3,
  },

  liquidity: {
    equalityToleranceAtr: 0.10,
    sweepBufferAtr: 0.05,
    lookbackBars: 50,
  },

  breakout: {
    closeBufferAtr: 0.05,
    requireRetest: true,
    maxRetestBars: 3,
  },

  reversal: {
    requireLiquiditySweep: true,
    requireStructureShift: true,
    requireDisplacement: true,
  },

  risk: {
    minimumRR: 2.0,
    stopBufferAtr: 0.1,
  },

  signal: {
    minimumScore: 60,
    highConfluenceScore: 80,
    maxExpiryBars: 12,
    maxConcurrentSignals: 3,
  },

  session: {
    enabled: true,
    allowedSessions: ['LONDON', 'NEW_YORK', 'OVERLAP_LONDON_NY'],
    blackoutBeforeEventMinutes: 15,
    blackoutAfterEventMinutes: 15,
  },

  scoring: {
    weights: {
      HTF_STRUCTURE: 20,
      ZONE: 15,
      LIQUIDITY: 15,
      STRUCTURE: 20,
      DISPLACEMENT: 10,
      CONFIRMATION: 10,
      RISK: 5,
      CONTEXT: 5,
    },
  },
};

// ─── Risk Configuration ──────────────────────────────────────────────────────

export interface RiskConfig {
  accountSize: number;
  riskPerTradePercent: number;
  maxDailyRiskPercent: number;
  maxConcurrentSignals: number;
  maxConsecutiveLosses: number;
  minimumRR: number;
  paperMode: boolean;
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  accountSize: 10000,
  riskPerTradePercent: 1.0,
  maxDailyRiskPercent: 3.0,
  maxConcurrentSignals: 3,
  maxConsecutiveLosses: 3,
  minimumRR: 2.0,
  paperMode: true,
};

// ─── Backtest Types ──────────────────────────────────────────────────────────

export interface BacktestConfig {
  symbol: string;
  dateFrom: number;
  dateTo: number;
  startingBalance: number;
  riskPerTrade: number;
  spread: number;
  slippage: number;
  minimumRR: number;
  sessionFilter: boolean;
  newsBlackout: boolean;
  strategyConfig: StrategyConfig;
  setupTypes: SetupType[];
  directions: SignalDirection[];
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  metrics: BacktestMetrics;
  trades: BacktestTrade[];
  strategyVersion: string;
  completedAt: number;
}

export interface BacktestMetrics {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  netResult: number;
  netResultPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  averageR: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingBars: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  longWins: number;
  longLosses: number;
  shortWins: number;
  shortLosses: number;
  breakoutWins: number;
  breakoutLosses: number;
  reversalWins: number;
  reversalLosses: number;
  maxFavorableExcursion: number;
  maxAdverseExcursion: number;
}

export interface BacktestTrade {
  signalId: string;
  direction: SignalDirection;
  setupType: SetupType;
  entryPrice: number;
  entryTime: number;
  exitPrice: number;
  exitTime: number;
  stopLoss: number;
  takeProfits: TakeProfitLevel[];
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
  rMultiple: number;
  pnl: number;
  holdingBars: number;
  maxFavorableExcursion: number;
  maxAdverseExcursion: number;
  exitReason: string;
}

// ─── Journal Types ───────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  symbol: string;
  direction: SignalDirection;
  setupType: SetupType;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN' | null;
  pnl: number | null;
  notes: string;
  emotionalState: string;
  ruleFollowingScore: number; // 1-10
  mistakeCategory: string | null;
  linkedSignalId: string | null;
  screenshotUrl: string | null;
  createdAt: number;
}

// ─── Chart Annotation Types ──────────────────────────────────────────────────

export type AnnotationType =
  | 'zone'
  | 'bos'
  | 'choch'
  | 'fvg'
  | 'liquidity'
  | 'signal_entry'
  | 'signal_stop'
  | 'signal_tp'
  | 'session'
  | 'swing_point';

export interface ChartAnnotation {
  type: AnnotationType;
  data: Zone | StructureEvent | FairValueGap | LiquidityLevel | SignalResult | SwingPoint;
  visible: boolean;
  timeframe: Timeframe;
}

// ─── Market Context ──────────────────────────────────────────────────────────

export interface MarketContext {
  symbol: string;
  currentPrice: number;
  currentSession: MarketSession;
  dailyHigh: number;
  dailyLow: number;
  previousDayHigh: number;
  previousDayLow: number;
  weeklyHigh: number;
  weeklyLow: number;
  atr4H: number;
  atr15M: number;
  volatilityState: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
  spreadCondition: 'NORMAL' | 'WIDE' | 'EXTREME';
  dataMode: 'LIVE' | 'DEMO' | 'REPLAY';
  dataSource: string;
  lastUpdate: number;
}

// ─── Macro Event ─────────────────────────────────────────────────────────────

export type MacroImpact = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MacroEvent {
  id: string;
  title: string;
  currency: string;
  impact: MacroImpact;
  timestamp: number;
  actual?: string;
  forecast?: string;
  previous?: string;
}

// ─── App Events ──────────────────────────────────────────────────────────────

export type AppEvent =
  | 'BAR_CLOSED'
  | 'PRICE_UPDATED'
  | 'STRUCTURE_CHANGED'
  | 'ZONE_CREATED'
  | 'ZONE_BROKEN'
  | 'LIQUIDITY_SWEPT'
  | 'SETUP_DETECTED'
  | 'SETUP_CONFIRMED'
  | 'SIGNAL_TRIGGERED'
  | 'SIGNAL_INVALIDATED'
  | 'SIGNAL_EXPIRED'
  | 'DATA_STALE'
  | 'PROVIDER_CHANGE';
