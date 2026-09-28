/**
 * Core market data types for the trading signal platform.
 * All market data flows through these normalized types regardless of provider.
 */

// ─── Timeframe ───────────────────────────────────────────────────────────────

export type Timeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D';

export const TIMEFRAME_MINUTES: Record<Timeframe, number> = {
  '1M': 1,
  '5M': 5,
  '15M': 15,
  '30M': 30,
  '1H': 60,
  '4H': 240,
  '1D': 1440,
};

// ─── Asset Class ─────────────────────────────────────────────────────────────

export type AssetClass = 'commodity' | 'crypto' | 'forex' | 'stock' | 'index';

// ─── Instrument Configuration ────────────────────────────────────────────────

export interface InstrumentConfig {
  symbol: string;
  displayName: string;
  assetClass: AssetClass;
  tickSize: number;
  decimalPlaces: number;
  sessionModel: SessionModel;
  timezone: string;
  tradingHours: TradingHours;
  priceSource: string;
  volumeAvailability: boolean;
  defaultTimeframes: Timeframe[];
  contractSize?: number;
  currency: string;
}

export interface TradingHours {
  sunday?: SessionRange;
  monday?: SessionRange;
  tuesday?: SessionRange;
  wednesday?: SessionRange;
  thursday?: SessionRange;
  friday?: SessionRange;
  saturday?: SessionRange;
}

export interface SessionRange {
  open: string; // HH:MM UTC
  close: string; // HH:MM UTC
}

export type SessionModel = 'forex' | 'stock' | 'crypto' | 'commodity';

// ─── Market Session ──────────────────────────────────────────────────────────

export type MarketSession = 'ASIA' | 'LONDON' | 'NEW_YORK' | 'OVERLAP_LONDON_NY' | 'OFF_HOURS';

export interface SessionDefinition {
  name: MarketSession;
  displayName: string;
  startHourUTC: number;
  startMinuteUTC: number;
  endHourUTC: number;
  endMinuteUTC: number;
  color: string;
}

// ─── Normalized Candle ───────────────────────────────────────────────────────

export interface Candle {
  symbol: string;
  timeframe: Timeframe;
  timestamp: number; // Unix ms, candle OPEN time
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  source: string; // Provider name
  isClosed: boolean;
}

// ─── Quote ───────────────────────────────────────────────────────────────────

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  spread: number;
  timestamp: number;
  source: string;
}

// ─── Provider Types ──────────────────────────────────────────────────────────

export type ProviderStatus = 'LIVE' | 'CONNECTING' | 'DEGRADED' | 'STALE' | 'OFFLINE';

export interface ProviderHealth {
  provider: string;
  status: ProviderStatus;
  lastTick: number | null;
  lastCandle: number | null;
  latencyMs: number | null;
  historicalDataAvailable: boolean;
  webSocketConnected: boolean;
  message?: string;
}

// ─── Data Mode ───────────────────────────────────────────────────────────────

export type DataMode = 'LIVE' | 'DEMO' | 'REPLAY';

// ─── Market Data Provider Interface ──────────────────────────────────────────

export interface MarketDataProvider {
  readonly name: string;
  readonly priority: number; // Lower = higher priority

  initialize(): Promise<void>;
  dispose(): Promise<void>;

  getHistoricalBars(
    symbol: string,
    timeframe: Timeframe,
    from: number,
    to: number,
    limit?: number
  ): Promise<Candle[]>;

  getLatestQuote(symbol: string): Promise<Quote | null>;

  subscribeToQuotes(
    symbol: string,
    callback: (quote: Quote) => void
  ): () => void; // Returns unsubscribe function

  subscribeToBars(
    symbol: string,
    timeframe: Timeframe,
    callback: (candle: Candle) => void
  ): () => void; // Returns unsubscribe function

  getProviderStatus(): ProviderHealth;

  supportsSymbol(symbol: string): boolean;
}

// ─── Default Instruments ─────────────────────────────────────────────────────

export const DEFAULT_INSTRUMENTS: InstrumentConfig[] = [
  {
    symbol: 'XAU/USD',
    displayName: 'Gold Spot',
    assetClass: 'commodity',
    tickSize: 0.01,
    decimalPlaces: 2,
    sessionModel: 'commodity',
    timezone: 'UTC',
    tradingHours: {
      sunday: { open: '22:00', close: '23:59' },
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '22:00' },
    },
    priceSource: 'spot',
    volumeAvailability: false,
    defaultTimeframes: ['4H', '15M'],
    currency: 'USD',
  },
  {
    symbol: 'BTC/USD',
    displayName: 'Bitcoin',
    assetClass: 'crypto',
    tickSize: 0.01,
    decimalPlaces: 2,
    sessionModel: 'crypto',
    timezone: 'UTC',
    tradingHours: {
      sunday: { open: '00:00', close: '23:59' },
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
    },
    priceSource: 'spot',
    volumeAvailability: true,
    defaultTimeframes: ['4H', '15M'],
    currency: 'USD',
  },
  {
    symbol: 'ETH/USD',
    displayName: 'Ethereum',
    assetClass: 'crypto',
    tickSize: 0.01,
    decimalPlaces: 2,
    sessionModel: 'crypto',
    timezone: 'UTC',
    tradingHours: {
      sunday: { open: '00:00', close: '23:59' },
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
    },
    priceSource: 'spot',
    volumeAvailability: true,
    defaultTimeframes: ['4H', '15M'],
    currency: 'USD',
  },
];

// ─── Session Definitions ─────────────────────────────────────────────────────

export const SESSION_DEFINITIONS: SessionDefinition[] = [
  {
    name: 'ASIA',
    displayName: 'Asia / Tokyo',
    startHourUTC: 0,
    startMinuteUTC: 0,
    endHourUTC: 8,
    endMinuteUTC: 0,
    color: 'rgba(147, 51, 234, 0.08)',
  },
  {
    name: 'LONDON',
    displayName: 'London',
    startHourUTC: 7,
    startMinuteUTC: 0,
    endHourUTC: 16,
    endMinuteUTC: 0,
    color: 'rgba(59, 130, 246, 0.08)',
  },
  {
    name: 'NEW_YORK',
    displayName: 'New York',
    startHourUTC: 12,
    startMinuteUTC: 0,
    endHourUTC: 21,
    endMinuteUTC: 0,
    color: 'rgba(34, 197, 94, 0.08)',
  },
  {
    name: 'OVERLAP_LONDON_NY',
    displayName: 'London / NY Overlap',
    startHourUTC: 12,
    startMinuteUTC: 0,
    endHourUTC: 16,
    endMinuteUTC: 0,
    color: 'rgba(245, 158, 11, 0.08)',
  },
];
