import { Candle } from '../types/market';
import { Zone, StrategyConfig } from '../types/strategy';
import { randomUUID } from 'crypto';

export function detectZones(candles: Candle[], atr: number, config: StrategyConfig): Zone[] {
  const zones: Zone[] = [];
  if (candles.length < 3) return zones;

  for (let i = 1; i < candles.length - 1; i++) {
    if (!candles[i+1].isClosed) continue;
    
    const baseCandle = candles[i];
    const impulseCandle = candles[i+1];
    const prevCandle = candles[i-1];

    const bodyBase = Math.abs(baseCandle.close - baseCandle.open);
    const rangeBase = baseCandle.high - baseCandle.low;
    const isBaseSmall = rangeBase < atr;

    if (!isBaseSmall) continue;

    // Demand
    const impulseUp = impulseCandle.close - impulseCandle.open;
    if (impulseUp > atr * config.zones.minDisplacementAtr) {
      zones.push({
        id: randomUUID(),
        type: 'DEMAND',
        high: config.zones.style === 'CANDLE_BODY' ? Math.max(baseCandle.open, baseCandle.close) : baseCandle.high,
        low: baseCandle.low,
        timeframe: baseCandle.timeframe,
        createdAt: baseCandle.timestamp,
        candleIndex: i,
        quality: { score: 80, factors: [] },
        touches: 0,
        state: 'FRESH',
        style: config.zones.style,
        sourceCandles: [prevCandle, baseCandle, impulseCandle]
      });
    }

    // Supply
    const impulseDown = impulseCandle.open - impulseCandle.close;
    if (impulseDown > atr * config.zones.minDisplacementAtr) {
      zones.push({
        id: randomUUID(),
        type: 'SUPPLY',
        high: baseCandle.high,
        low: config.zones.style === 'CANDLE_BODY' ? Math.min(baseCandle.open, baseCandle.close) : baseCandle.low,
        timeframe: baseCandle.timeframe,
        createdAt: baseCandle.timestamp,
        candleIndex: i,
        quality: { score: 80, factors: [] },
        touches: 0,
        state: 'FRESH',
        style: config.zones.style,
        sourceCandles: [prevCandle, baseCandle, impulseCandle]
      });
    }
  }

  return zones;
}
