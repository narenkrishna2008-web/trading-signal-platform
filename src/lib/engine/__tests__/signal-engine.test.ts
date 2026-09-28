import { describe, it, expect } from 'vitest';
import { evaluateMarket } from '../signal-engine';
import { DEFAULT_STRATEGY_CONFIG } from '../../types/strategy';
import { generateBullishSequence, generateBearishSequence, makeCandle } from './fixtures';

describe('Signal Engine Scenarios (Prompt Requirement #69)', () => {
  it('Scenario 1: Stale Data Feed immediately blocks signal generation', () => {
    const candles4H = generateBullishSequence(35);
    const candles15M = generateBullishSequence(45);

    const result = evaluateMarket({
      candles4H,
      candles15M,
      currentPrice: 2650,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: false, // STALE!
      macroBlackout: false,
    });

    expect(result.status).toBe('DATA_STALE');
    expect(result.entry).toBeNull();
    expect(result.stopLoss).toBeNull();
    expect(result.warnings.some(w => w.includes('stale'))).toBe(true);
  });

  it('Scenario 2: Macro Blackout Window pauses trading', () => {
    const candles4H = generateBullishSequence(35);
    const candles15M = generateBullishSequence(45);

    const result = evaluateMarket({
      candles4H,
      candles15M,
      currentPrice: 2650,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: true,
      macroBlackout: true, // Blackout active (e.g. FOMC / CPI release)
    });

    expect(result.status).toBe('NO_TRADE');
    expect(result.warnings.some(w => w.includes('blackout') || w.includes('Macro'))).toBe(true);
  });

  it('Scenario 3: Insufficient Historical Candles returns MARKET_UNAVAILABLE', () => {
    const candles4H = generateBullishSequence(5); // Only 5 candles
    const candles15M = generateBullishSequence(5);

    const result = evaluateMarket({
      candles4H,
      candles15M,
      currentPrice: 2650,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: true,
      macroBlackout: false,
    });

    expect(result.status).toBe('MARKET_UNAVAILABLE');
  });

  it('Scenario 4: Valid Bullish Market Structure detects Bullish Bias with reasons', () => {
    const candles4H = generateBullishSequence(40, 2600);
    const candles15M = generateBullishSequence(45, 2640);
    const lastPrice = candles15M[candles15M.length - 1].close;

    const result = evaluateMarket({
      candles4H,
      candles15M,
      currentPrice: lastPrice,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: true,
      macroBlackout: false,
    });

    expect(result.htfBias).not.toBeNull();
    expect(result.htfBias?.bias).toBe('BULLISH');
    expect(result.reasons.some(r => r.category === 'HTF_STRUCTURE' && r.passed)).toBe(true);
  });

  it('Scenario 5: Valid Bearish Market Structure detects Bearish Bias with reasons', () => {
    const candles4H = generateBearishSequence(40, 2750);
    const candles15M = generateBearishSequence(45, 2700);
    const lastPrice = candles15M[candles15M.length - 1].close;

    const result = evaluateMarket({
      candles4H,
      candles15M,
      currentPrice: lastPrice,
      symbol: 'XAU/USD',
      config: DEFAULT_STRATEGY_CONFIG,
      dataSource: 'TEST',
      dataFresh: true,
      macroBlackout: false,
    });

    expect(result.htfBias).not.toBeNull();
    expect(result.htfBias?.bias).toBe('BEARISH');
    expect(result.reasons.some(r => r.category === 'HTF_STRUCTURE' && r.passed)).toBe(true);
  });
});
