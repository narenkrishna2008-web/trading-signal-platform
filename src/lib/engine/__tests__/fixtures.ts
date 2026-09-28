import { Candle, Timeframe } from '../../types/market';

/**
 * Creates a synthetic candle with specified properties.
 */
export function makeCandle(
  timestamp: number,
  open: number,
  high: number,
  low: number,
  close: number,
  timeframe: Timeframe = '15M',
  isClosed: boolean = true
): Candle {
  return {
    symbol: 'XAU/USD',
    timeframe,
    timestamp,
    open,
    high,
    low,
    close,
    volume: 500,
    source: 'TEST_FIXTURE',
    isClosed,
  };
}

/**
 * Generates an ascending trend of candles (Higher Highs, Higher Lows).
 */
export function generateBullishSequence(count: number = 40, basePrice: number = 2600): Candle[] {
  const candles: Candle[] = [];
  const start = 1700000000000;
  const stepMs = 15 * 60 * 1000;
  let price = basePrice;

  for (let i = 0; i < count; i++) {
    const isUp = i % 4 !== 2; // Mostly up, with occasional pullbacks
    const open = price;
    const move = isUp ? 3.0 : -1.5;
    const close = open + move;
    const high = Math.max(open, close) + 1.0;
    const low = Math.min(open, close) - 1.0;

    candles.push(makeCandle(start + i * stepMs, open, high, low, close, '15M', true));
    price = close;
  }

  return candles;
}

/**
 * Generates a descending trend of candles (Lower Highs, Lower Lows).
 */
export function generateBearishSequence(count: number = 40, basePrice: number = 2700): Candle[] {
  const candles: Candle[] = [];
  const start = 1700000000000;
  const stepMs = 15 * 60 * 1000;
  let price = basePrice;

  for (let i = 0; i < count; i++) {
    const isDown = i % 4 !== 2;
    const open = price;
    const move = isDown ? -3.0 : 1.5;
    const close = open + move;
    const high = Math.max(open, close) + 1.0;
    const low = Math.min(open, close) - 1.0;

    candles.push(makeCandle(start + i * stepMs, open, high, low, close, '15M', true));
    price = close;
  }

  return candles;
}
