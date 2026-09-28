import { describe, it, expect } from 'vitest';
import { detectStructure } from '../market-structure';
import { SwingPoint } from '../../types/strategy';

describe('Market Structure Engine (BOS / CHOCH)', () => {
  it('should identify a bullish BOS when higher high forms after an established high', () => {
    const swings: SwingPoint[] = [
      { type: 'SWING_HIGH', price: 2650, timestamp: 1000, candleIndex: 2, confirmed: true, leftBars: 2, rightBars: 2 },
      { type: 'SWING_LOW', price: 2630, timestamp: 2000, candleIndex: 5, confirmed: true, leftBars: 2, rightBars: 2 },
      { type: 'SWING_HIGH', price: 2670, timestamp: 3000, candleIndex: 8, confirmed: true, leftBars: 2, rightBars: 2 }, // Breaks 2650
    ];

    const events = detectStructure(swings);
    const bosEvents = events.filter(e => e.type === 'BOS');

    expect(bosEvents.length).toBeGreaterThan(0);
    expect(bosEvents[0].direction).toBe('BULLISH');
    expect(bosEvents[0].breakPrice).toBe(2670);
    expect(bosEvents[0].referencePrice).toBe(2650);
  });

  it('should identify a bearish CHOCH when price shifts from bullish to breaking a major swing low', () => {
    const swings: SwingPoint[] = [
      { type: 'SWING_LOW', price: 2600, timestamp: 1000, candleIndex: 2, confirmed: true, leftBars: 2, rightBars: 2 },
      { type: 'SWING_HIGH', price: 2640, timestamp: 2000, candleIndex: 5, confirmed: true, leftBars: 2, rightBars: 2 },
      { type: 'SWING_LOW', price: 2620, timestamp: 3000, candleIndex: 8, confirmed: true, leftBars: 2, rightBars: 2 }, // Higher low
      { type: 'SWING_HIGH', price: 2660, timestamp: 4000, candleIndex: 11, confirmed: true, leftBars: 2, rightBars: 2 }, // Higher high -> Bullish established
      { type: 'SWING_LOW', price: 2590, timestamp: 5000, candleIndex: 14, confirmed: true, leftBars: 2, rightBars: 2 }, // Breaches 2620 -> CHOCH
    ];

    const events = detectStructure(swings);
    const chochEvents = events.filter(e => e.type === 'CHOCH');

    expect(chochEvents.length).toBeGreaterThan(0);
    const latestChoch = chochEvents[chochEvents.length - 1];
    expect(latestChoch.direction).toBe('BEARISH');
    expect(latestChoch.breakPrice).toBe(2590);
  });
});
