import { Candle } from '../types/market';
import { SwingPoint } from '../types/strategy';

export function detectSwingPoints(candles: Candle[], leftBars: number = 2, rightBars: number = 2): SwingPoint[] {
  const swings: SwingPoint[] = [];
  
  if (candles.length < leftBars + rightBars + 1) return swings;

  for (let i = leftBars; i < candles.length - rightBars; i++) {
    const currentCandle = candles[i];
    if (!currentCandle.isClosed) continue;

    let allRightClosed = true;
    for(let k = 1; k <= rightBars; k++) {
        if(!candles[i+k].isClosed) { allRightClosed = false; break; }
    }
    if(!allRightClosed) continue;

    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= leftBars; j++) {
      if (candles[i - j].high > currentCandle.high) isHigh = false; // Strictly greater to avoid flat tops
      if (candles[i - j].low < currentCandle.low) isLow = false;
    }

    for (let j = 1; j <= rightBars; j++) {
      if (candles[i + j].high >= currentCandle.high) isHigh = false;
      if (candles[i + j].low <= currentCandle.low) isLow = false;
    }

    if (isHigh) {
      swings.push({
        type: 'SWING_HIGH',
        price: currentCandle.high,
        timestamp: currentCandle.timestamp,
        candleIndex: i,
        confirmed: true,
        leftBars,
        rightBars
      });
    }

    if (isLow) {
      swings.push({
        type: 'SWING_LOW',
        price: currentCandle.low,
        timestamp: currentCandle.timestamp,
        candleIndex: i,
        confirmed: true,
        leftBars,
        rightBars
      });
    }
  }

  return swings;
}
