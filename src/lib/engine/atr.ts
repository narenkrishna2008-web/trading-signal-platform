import { Candle } from '../types/market';

export function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length <= period) return 0;
  
  let trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) return 0;

  // Simple Moving Average of True Range for the first ATR
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trueRanges[i];
  }
  let atr = sum / period;

  // Smoothing for subsequent ATRs
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }
  
  return atr;
}

export function updateATR(prevAtr: number, previousCandle: Candle, currentCandle: Candle, period: number = 14): number {
  if (!prevAtr) return 0;
  
  const high = currentCandle.high;
  const low = currentCandle.low;
  const prevClose = previousCandle.close;
  
  const tr = Math.max(
    high - low,
    Math.abs(high - prevClose),
    Math.abs(low - prevClose)
  );

  return ((prevAtr * (period - 1)) + tr) / period;
}
