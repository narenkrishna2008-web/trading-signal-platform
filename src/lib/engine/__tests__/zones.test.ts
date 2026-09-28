import { describe, it, expect } from 'vitest';
import { detectZones } from '../zones';
import { DEFAULT_STRATEGY_CONFIG } from '../../types/strategy';
import { makeCandle } from './fixtures';

describe('Supply / Demand Zone Detection Engine', () => {
  it('should detect a fresh demand zone at the base of an impulsive bullish move', () => {
    const atr = 5.0;
    const t0 = 1000000;
    const step = 900000;

    // Base candle at index 1: small range (2.0 < atr), followed by massive bullish impulse (15.0 > atr * 1.5)
    const candles = [
      makeCandle(t0 + 0 * step, 2630, 2633, 2628, 2631),
      makeCandle(t0 + 1 * step, 2631, 2632, 2629, 2630), // Small base candle
      makeCandle(t0 + 2 * step, 2630, 2648, 2630, 2647), // Huge Bullish Impulse (+17 pts)
    ];

    const zones = detectZones(candles, atr, DEFAULT_STRATEGY_CONFIG);
    const demandZones = zones.filter(z => z.type === 'DEMAND');

    expect(demandZones.length).toBeGreaterThan(0);
    expect(demandZones[0].state).toBe('FRESH');
    expect(demandZones[0].low).toBe(2629);
  });

  it('should detect a fresh supply zone at the base of an impulsive bearish move', () => {
    const atr = 5.0;
    const t0 = 1000000;
    const step = 900000;

    const candles = [
      makeCandle(t0 + 0 * step, 2660, 2663, 2658, 2661),
      makeCandle(t0 + 1 * step, 2661, 2663, 2660, 2662), // Small base candle
      makeCandle(t0 + 2 * step, 2662, 2662, 2643, 2645), // Huge Bearish Impulse (-17 pts)
    ];

    const zones = detectZones(candles, atr, DEFAULT_STRATEGY_CONFIG);
    const supplyZones = zones.filter(z => z.type === 'SUPPLY');

    expect(supplyZones.length).toBeGreaterThan(0);
    expect(supplyZones[0].state).toBe('FRESH');
    expect(supplyZones[0].high).toBe(2663);
  });
});
