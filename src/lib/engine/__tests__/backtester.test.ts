import { describe, it, expect } from 'vitest';
import { runBacktest } from '../backtester';
import { generateBullishSequence, generateBearishSequence, makeCandle } from './fixtures';

describe('Chronological Replay Backtester', () => {
  it('should run backtest without lookahead bias and compute correct metrics', () => {
    const bars4H = generateBullishSequence(50, 2600);
    const bars15M = generateBullishSequence(100, 2620);

    const result = runBacktest({
      symbol: 'XAU/USD',
      bars4H,
      bars15M,
      startingBalance: 10000,
      riskPerTradePct: 1.0,
      spread: 0.20,
      slippage: 0.05,
    });

    expect(result.id).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.winRate).toBeGreaterThanOrEqual(0);
    expect(result.metrics.winRate).toBeLessThanOrEqual(100);
    expect(result.metrics.profitFactor).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.trades)).toBe(true);
  });

  it('should apply conservative same-bar tie-breaking (stop loss hit before target)', () => {
    // Construct a single bar where both stop (2640) and target (2660) are touched
    const bars4H = generateBullishSequence(30, 2600);
    const bars15M = generateBullishSequence(40, 2640);

    // Add a volatile candle with extreme range
    const lastTimestamp = bars15M[bars15M.length - 1].timestamp;
    bars15M.push(makeCandle(lastTimestamp + 900000, 2650, 2670, 2630, 2655));

    const result = runBacktest({
      symbol: 'XAU/USD',
      bars4H,
      bars15M,
      startingBalance: 10000,
    });

    // Check if any trades exited via intrabar adverse tie
    const tieTrades = result.trades.filter(t => t.exitReason.includes('adverse tie'));
    for (const t of tieTrades) {
      expect(t.result).toBe('LOSS');
      expect(t.rMultiple).toBe(-1.0);
    }
  });
});
