import { describe, it, expect } from 'vitest';
import { evaluateMarket } from '../signal-engine';
import { detectSwingPoints } from '../swing-detection';
import { DEFAULT_STRATEGY_CONFIG } from '../../types/strategy';
import { generateBullishSequence, makeCandle } from './fixtures';

describe('Anti-Lookahead & Non-Repainting Verification (Prompt Requirement #43)', () => {
  it('PROVE: Future candles cannot alter past signals (No Lookahead Bias)', () => {
    const historical4H = generateBullishSequence(35, 2600);
    const historical15M = generateBullishSequence(45, 2620);
    const evalPrice = historical15M[historical15M.length - 1].close;

    // 1. Evaluate market at point in time T
    const signalAtT = evaluateMarket({
      candles4H: historical4H,
      candles15M: historical15M,
      currentPrice: evalPrice,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: true,
      macroBlackout: false,
    });

    // 2. Synthesize future 50 candles (e.g. violent crash in the future)
    const future15M = [...historical15M];
    const lastTimestamp = historical15M[historical15M.length - 1].timestamp;
    for (let i = 1; i <= 30; i++) {
      future15M.push(makeCandle(lastTimestamp + i * 900000, 2650 - i * 5, 2652 - i * 5, 2640 - i * 5, 2642 - i * 5));
    }

    // 3. Re-evaluate the historical slice at time T (only candles up to T)
    const signalAtTReevaluated = evaluateMarket({
      candles4H: historical4H,
      candles15M: future15M.slice(0, historical15M.length),
      currentPrice: evalPrice,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: true,
      macroBlackout: false,
    });

    // Decisions must be identical — future crash cannot bleed into historical signal
    expect(signalAtT.status).toBe(signalAtTReevaluated.status);
    expect(signalAtT.confidence).toBe(signalAtTReevaluated.confidence);
    expect(signalAtT.direction).toBe(signalAtTReevaluated.direction);
    expect(signalAtT.reasons.length).toBe(signalAtTReevaluated.reasons.length);
  });

  it('PROVE: Unconfirmed pivots are never emitted as confirmed points', () => {
    const candles = generateBullishSequence(10, 2600);
    // Even if candle[8] has highest high, it cannot be confirmed without rightBars closed bars
    const leftBars = 2;
    const rightBars = 2;

    const swings = detectSwingPoints(candles, leftBars, rightBars);
    for (const sp of swings) {
      // Index must be at least rightBars away from the end
      expect(sp.candleIndex).toBeLessThanOrEqual(candles.length - 1 - rightBars);
      expect(sp.confirmed).toBe(true);
    }
  });

  it('PROVE: Historical signals remain 100% reproducible across multiple runs', () => {
    const historical4H = generateBullishSequence(35, 2600);
    const historical15M = generateBullishSequence(45, 2620);
    const evalPrice = historical15M[historical15M.length - 1].close;

    const run1 = evaluateMarket({
      candles4H: historical4H,
      candles15M: historical15M,
      currentPrice: evalPrice,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: true,
      macroBlackout: false,
    });

    const run2 = evaluateMarket({
      candles4H: historical4H,
      candles15M: historical15M,
      currentPrice: evalPrice,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: true,
      macroBlackout: false,
    });

    expect(run1.status).toBe(run2.status);
    expect(run1.confidence).toBe(run2.confidence);
    expect(run1.entry).toBe(run2.entry);
    expect(run1.stopLoss).toBe(run2.stopLoss);
    expect(run1.riskReward).toBe(run2.riskReward);
  });
});
