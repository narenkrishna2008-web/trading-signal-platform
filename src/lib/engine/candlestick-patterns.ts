import { Candle } from '../types/market';
import { CandlePatternEvent } from '../types/strategy';

export function detectPatterns(candles: Candle[], index: number): CandlePatternEvent[] {
  const events: CandlePatternEvent[] = [];
  if (index < 1 || index >= candles.length) return events;
  
  const current = candles[index];
  const prev = candles[index - 1];
  if (!current.isClosed || !prev.isClosed) return events;

  const currentBody = Math.abs(current.close - current.open);
  const currentRange = current.high - current.low;
  const prevBody = Math.abs(prev.close - prev.open);
  const prevRange = prev.high - prev.low;

  const isCurrentBullish = current.close > current.open;
  const isCurrentBearish = current.close < current.open;
  const isPrevBullish = prev.close > prev.open;
  const isPrevBearish = prev.close < prev.open;

  // Engulfing
  if (isCurrentBullish && isPrevBearish && current.close > prev.open && current.open < prev.close) {
    events.push({
      pattern: 'BULLISH_ENGULFING',
      direction: 'BULLISH',
      timestamp: current.timestamp,
      candleIndex: index,
      candle: current,
      previousCandle: prev
    });
  } else if (isCurrentBearish && isPrevBullish && current.close < prev.open && current.open > prev.close) {
    events.push({
      pattern: 'BEARISH_ENGULFING',
      direction: 'BEARISH',
      timestamp: current.timestamp,
      candleIndex: index,
      candle: current,
      previousCandle: prev
    });
  }

  // Pin Bar
  const upperWick = current.high - Math.max(current.open, current.close);
  const lowerWick = Math.min(current.open, current.close) - current.low;
  
  if (lowerWick > currentBody * 2 && upperWick < currentBody * 0.5) {
    events.push({
      pattern: 'BULLISH_PIN_BAR',
      direction: 'BULLISH',
      timestamp: current.timestamp,
      candleIndex: index,
      candle: current
    });
  } else if (upperWick > currentBody * 2 && lowerWick < currentBody * 0.5) {
    events.push({
      pattern: 'BEARISH_PIN_BAR',
      direction: 'BEARISH',
      timestamp: current.timestamp,
      candleIndex: index,
      candle: current
    });
  }

  // Strong Body
  if (currentBody / currentRange > 0.8) {
    events.push({
      pattern: isCurrentBullish ? 'STRONG_BULLISH_BODY' : 'STRONG_BEARISH_BODY',
      direction: isCurrentBullish ? 'BULLISH' : 'BEARISH',
      timestamp: current.timestamp,
      candleIndex: index,
      candle: current
    });
  }

  // Inside Bar
  if (current.high < prev.high && current.low > prev.low) {
    events.push({
      pattern: 'INSIDE_BAR',
      direction: isCurrentBullish ? 'BULLISH' : 'BEARISH',
      timestamp: current.timestamp,
      candleIndex: index,
      candle: current,
      previousCandle: prev
    });
  }

  return events;
}
