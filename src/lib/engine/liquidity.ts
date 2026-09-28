import { Candle } from '../types/market';
import { LiquidityLevel, LiquiditySweep, SwingPoint, StrategyConfig } from '../types/strategy';
import { randomUUID } from 'crypto';

export function detectLiquidityLevels(candles: Candle[], swingPoints: SwingPoint[], config: StrategyConfig): LiquidityLevel[] {
  const levels: LiquidityLevel[] = [];
  
  for (const sp of swingPoints) {
    if (!sp.confirmed) continue;
    
    levels.push({
      id: randomUUID(),
      type: sp.type === 'SWING_HIGH' ? 'BUY_SIDE' : 'SELL_SIDE',
      source: sp.type,
      price: sp.price,
      timestamp: sp.timestamp,
      state: 'RESTING',
      strength: 50
    });
  }

  return levels;
}

export function detectLiquiditySweeps(candles: Candle[], levels: LiquidityLevel[], config: StrategyConfig): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = [];
  if (candles.length === 0) return sweeps;
  
  const currentCandle = candles[candles.length - 1];
  if (!currentCandle.isClosed) return sweeps;

  for (const level of levels) {
    if (level.state !== 'RESTING') continue;

    if (level.type === 'BUY_SIDE' && currentCandle.high > level.price && currentCandle.close < level.price) {
      sweeps.push({
        id: randomUUID(),
        liquidityLevel: level,
        sweepTimestamp: currentCandle.timestamp,
        sweepPrice: currentCandle.high,
        rejectionConfirmed: true,
        structureShiftConfirmed: false
      });
      level.state = 'SWEPT';
      level.sweptAt = currentCandle.timestamp;
    } else if (level.type === 'SELL_SIDE' && currentCandle.low < level.price && currentCandle.close > level.price) {
      sweeps.push({
        id: randomUUID(),
        liquidityLevel: level,
        sweepTimestamp: currentCandle.timestamp,
        sweepPrice: currentCandle.low,
        rejectionConfirmed: true,
        structureShiftConfirmed: false
      });
      level.state = 'SWEPT';
      level.sweptAt = currentCandle.timestamp;
    }
  }

  return sweeps;
}
