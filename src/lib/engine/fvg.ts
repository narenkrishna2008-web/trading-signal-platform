import { Candle } from '../types/market';
import { FairValueGap, StrategyConfig } from '../types/strategy';
import { randomUUID } from 'crypto';

export function detectFVGs(candles: Candle[], atr: number, config: StrategyConfig): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  if (!config.fvg.enabled || candles.length < 3) return fvgs;

  const minGap = atr * config.fvg.minGapAtr;

  for (let i = 2; i < candles.length; i++) {
    if (!candles[i].isClosed) continue;
    
    const c1 = candles[i - 2];
    const c2 = candles[i - 1]; // Imbalance candle
    const c3 = candles[i];

    // Bullish FVG: c1.high < c3.low
    if (c1.high < c3.low - minGap) {
      fvgs.push({
        id: randomUUID(),
        type: 'BULLISH',
        high: c3.low,
        low: c1.high,
        timestamp: c2.timestamp,
        candleIndex: i - 1,
        timeframe: c2.timeframe,
        gapSize: c3.low - c1.high,
        filled: false,
        fillPercentage: 0
      });
    }

    // Bearish FVG: c1.low > c3.high
    if (c1.low > c3.high + minGap) {
      fvgs.push({
        id: randomUUID(),
        type: 'BEARISH',
        high: c1.low,
        low: c3.high,
        timestamp: c2.timestamp,
        candleIndex: i - 1,
        timeframe: c2.timeframe,
        gapSize: c1.low - c3.high,
        filled: false,
        fillPercentage: 0
      });
    }
  }

  return fvgs;
}
