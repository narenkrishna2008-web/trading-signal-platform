import { describe, it, expect } from 'vitest';
import { detectSwingPoints } from '../swing-detection';
import { makeCandle } from './fixtures';

describe('Swing Detection Engine', () => {
  it('should detect a valid swing high when confirmed by rightBars closed candles', () => {
    const t0 = 1000000;
    const step = 60000;

    // Pattern: 10, 12, 15 (high), 13, 11 (leftBars=2, rightBars=2)
    const candles = [
      makeCandle(t0 + 0 * step, 10, 11, 9, 10),
      makeCandle(t0 + 1 * step, 10, 12, 9.5, 11.5),
      makeCandle(t0 + 2 * step, 11.5, 15, 11, 14.5), // Peak
      makeCandle(t0 + 3 * step, 14.5, 14, 12, 13),
      makeCandle(t0 + 4 * step, 13, 12, 10.5, 11),
    ];

    const swings = detectSwingPoints(candles, 2, 2);
    const swingHighs = swings.filter(s => s.type === 'SWING_HIGH');

    expect(swingHighs.length).toBe(1);
    expect(swingHighs[0].price).toBe(15);
    expect(swingHighs[0].candleIndex).toBe(2);
    expect(swingHighs[0].confirmed).toBe(true);
  });

  it('should detect a valid swing low when confirmed', () => {
    const t0 = 1000000;
    const step = 60000;

    // Pattern: 20, 18, 14 (low), 16, 19
    const candles = [
      makeCandle(t0 + 0 * step, 20, 21, 19.5, 20),
      makeCandle(t0 + 1 * step, 20, 20, 17.5, 18),
      makeCandle(t0 + 2 * step, 18, 18.5, 14, 15), // Trough
      makeCandle(t0 + 3 * step, 15, 17, 14.5, 16.5),
      makeCandle(t0 + 4 * step, 16.5, 19, 16, 18.5),
    ];

    const swings = detectSwingPoints(candles, 2, 2);
    const swingLows = swings.filter(s => s.type === 'SWING_LOW');

    expect(swingLows.length).toBe(1);
    expect(swingLows[0].price).toBe(14);
    expect(swingLows[0].candleIndex).toBe(2);
    expect(swingLows[0].confirmed).toBe(true);
  });

  it('must NOT confirm a swing if right-side candles are not closed (Non-repainting rule)', () => {
    const t0 = 1000000;
    const step = 60000;

    // Last candle is unclosed (isClosed = false)
    const candles = [
      makeCandle(t0 + 0 * step, 10, 11, 9, 10),
      makeCandle(t0 + 1 * step, 10, 12, 9.5, 11.5),
      makeCandle(t0 + 2 * step, 11.5, 15, 11, 14.5),
      makeCandle(t0 + 3 * step, 14.5, 14, 12, 13),
      makeCandle(t0 + 4 * step, 13, 12, 10.5, 11, '15M', false), // UNCLOSED
    ];

    const swings = detectSwingPoints(candles, 2, 2);
    expect(swings.length).toBe(0); // Cannot confirm peak at index 2 without 2 closed bars to the right!
  });
});
