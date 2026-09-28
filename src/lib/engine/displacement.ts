import { Candle } from '../types/market';
import { DisplacementEvent, StrategyConfig } from '../types/strategy';

export function detectDisplacement(candle: Candle, atr: number, config: StrategyConfig): DisplacementEvent | null {
  if (!candle.isClosed) return null;

  const range = candle.high - candle.low;
  if (range <= atr * config.displacement.atrMultiple) return null;

  const body = Math.abs(candle.close - candle.open);
  const bodyRatio = body / range;
  
  if (bodyRatio < config.displacement.minimumBodyRatio) return null;

  const direction = candle.close > candle.open ? 'BULLISH' : 'BEARISH';

  return {
    direction,
    candle,
    atrMultiple: range / atr,
    bodyRatio,
    structureBreak: false, // Handled by structure engine
    timestamp: candle.timestamp,
    confirmed: true
  };
}
