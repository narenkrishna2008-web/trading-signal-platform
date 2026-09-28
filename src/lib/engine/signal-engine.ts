/**
 * Central deterministic signal decision engine.
 * 
 * This is the core of the trading platform. It evaluates all market conditions
 * and produces a structured signal result with full explainability.
 * 
 * RULES:
 * - Only uses CLOSED candles for confirmed decisions
 * - No lookahead bias
 * - No repainting
 * - Default output is NO_TRADE
 * - Every signal has machine-readable reasons
 * - All thresholds from StrategyConfig
 */

import { Candle, Timeframe } from '../types/market';
import {
  SignalResult, SignalStatus, SignalDirection, SignalLifecycle,
  SignalQualityTier, SignalReason, ReasonCategory,
  SetupType, SetupChecklist, ChecklistItem,
  StrategyConfig, BiasAssessment, Zone, LiquiditySweep,
  StructureEvent, DisplacementEvent, CandlePatternEvent,
  TakeProfitLevel, SwingPoint, FairValueGap, LiquidityLevel,
  MarketContext,
} from '../types/strategy';
import { detectSwingPoints } from './swing-detection';
import { detectStructure } from './market-structure';
import { assessBias } from './bias';
import { detectZones } from './zones';
import { detectFVGs } from './fvg';
import { detectLiquidityLevels, detectLiquiditySweeps } from './liquidity';
import { detectDisplacement } from './displacement';
import { detectPatterns } from './candlestick-patterns';
import { calculateATR } from './atr';
import { calculateRiskReward } from './risk';
import { getCurrentSession, isSessionAllowed } from './session';

// ─── Evaluation Context ──────────────────────────────────────────────────────

export interface EvaluationInput {
  candles4H: Candle[];
  candles15M: Candle[];
  currentPrice: number;
  symbol: string;
  config: StrategyConfig;
  dataSource: string;
  dataFresh: boolean;
  macroBlackout?: boolean;
}

// ─── Main Evaluation Function ────────────────────────────────────────────────

export function evaluateMarket(input: EvaluationInput): SignalResult {
  const {
    candles4H, candles15M, currentPrice, symbol,
    config, dataSource, dataFresh, macroBlackout
  } = input;

  const timestamp = Date.now();
  const reasons: SignalReason[] = [];
  const warnings: string[] = [];

  // ─── Data Quality Gate ─────────────────────────────────────────────────
  if (!dataFresh) {
    return createNoSignal(symbol, config, timestamp, dataSource, 'DATA_STALE', reasons, ['Data feed is stale — signals paused']);
  }

  if (candles4H.length < 30 || candles15M.length < 30) {
    return createNoSignal(symbol, config, timestamp, dataSource, 'MARKET_UNAVAILABLE', reasons, ['Insufficient historical data']);
  }

  // ─── Session Gate ──────────────────────────────────────────────────────
  const currentSession = getCurrentSession(timestamp);

  if (config.session.enabled && !isSessionAllowed(currentSession, config)) {
    reasons.push(makeReason('CONTEXT', false, `Session ${currentSession} not in allowed sessions`, config));
    return createNoSignal(symbol, config, timestamp, dataSource, 'NO_TRADE', reasons, [`Trading session ${currentSession} outside active hours`]);
  }

  // ─── Macro Gate ────────────────────────────────────────────────────────
  if (macroBlackout) {
    reasons.push(makeReason('CONTEXT', false, 'High-impact macro event blackout active', config));
    return createNoSignal(symbol, config, timestamp, dataSource, 'NO_TRADE', reasons, ['Macro event blackout — trading paused']);
  }

  // ─── 4H Analysis ──────────────────────────────────────────────────────
  const closed4H = candles4H.filter(c => c.isClosed);
  const atr4H = calculateATR(closed4H, config.displacement.atrPeriod);

  const swings4H = detectSwingPoints(closed4H, config.swingDetection.leftBars, config.swingDetection.rightBars);
  const structure4H = detectStructure(swings4H);
  const bias = assessBias(closed4H, config);

  // Score HTF structure
  if (bias.bias === 'BULLISH') {
    reasons.push(makeReason('HTF_STRUCTURE', true, `4H bullish structure confirmed — ${bias.reasons.join(', ')}`, config));
  } else if (bias.bias === 'BEARISH') {
    reasons.push(makeReason('HTF_STRUCTURE', true, `4H bearish structure confirmed — ${bias.reasons.join(', ')}`, config));
  } else {
    reasons.push(makeReason('HTF_STRUCTURE', false, '4H structure neutral/unclear — no directional bias', config));
  }

  // Determine potential direction from HTF
  const htfDirection: SignalDirection | null =
    bias.bias === 'BULLISH' ? 'BUY' :
    bias.bias === 'BEARISH' ? 'SELL' : null;

  // ─── 15M Analysis ──────────────────────────────────────────────────────
  const closed15M = candles15M.filter(c => c.isClosed);
  const atr15M = calculateATR(closed15M, config.displacement.atrPeriod);

  const swings15M = detectSwingPoints(closed15M, config.swingDetection.leftBars, config.swingDetection.rightBars);
  const structure15M = detectStructure(swings15M);
  const zones15M = detectZones(closed15M, atr15M, config);
  const zones4H = detectZones(closed4H, atr4H, config);
  const allZones = [...zones4H, ...zones15M];
  const fvgs15M = detectFVGs(closed15M, atr15M, config);
  const liquidityLevels = detectLiquidityLevels(closed15M, swings15M, config);
  const liquiditySweeps = detectLiquiditySweeps(closed15M, liquidityLevels, config);

  // Check displacement on latest closed candle
  const latestClosed15M = closed15M[closed15M.length - 1];
  const displacementEvent = latestClosed15M
    ? detectDisplacement(latestClosed15M, atr15M, config)
    : null;

  // Check candlestick patterns at the latest candle
  const patterns = closed15M.length > 1
    ? detectPatterns(closed15M, closed15M.length - 1)
    : [];

  // ─── Find Active Zone ──────────────────────────────────────────────────
  const activeZone = findActiveZone(allZones, currentPrice, htfDirection);

  if (activeZone) {
    const freshLabel = activeZone.state === 'FRESH' ? 'Fresh' : 'Tested';
    reasons.push(makeReason('ZONE', true, `${freshLabel} ${activeZone.type.toLowerCase()} zone [${activeZone.low.toFixed(2)} - ${activeZone.high.toFixed(2)}]`, config));
  } else {
    reasons.push(makeReason('ZONE', false, 'No active zone for current price', config));
  }

  // ─── Check Liquidity ───────────────────────────────────────────────────
  const recentSweep = findRecentSweep(liquiditySweeps, htfDirection);

  if (recentSweep) {
    reasons.push(makeReason('LIQUIDITY', true,
      `${recentSweep.liquidityLevel.type === 'SELL_SIDE' ? 'Sell-side' : 'Buy-side'} liquidity swept at ${recentSweep.sweepPrice.toFixed(2)}`, config));
  } else {
    reasons.push(makeReason('LIQUIDITY', false, 'No recent liquidity sweep detected', config));
  }

  // ─── Check 15M Structure ───────────────────────────────────────────────
  const ltfStructureEvent = findRelevantStructureEvent(structure15M, htfDirection);

  if (ltfStructureEvent) {
    reasons.push(makeReason('STRUCTURE', true,
      `15M ${ltfStructureEvent.type} (${ltfStructureEvent.structureType}) confirmed at ${ltfStructureEvent.breakPrice.toFixed(2)}`, config));
  } else {
    reasons.push(makeReason('STRUCTURE', false, '15M structure confirmation pending', config));
  }

  // ─── Check Displacement ────────────────────────────────────────────────
  if (displacementEvent && displacementEvent.confirmed) {
    reasons.push(makeReason('DISPLACEMENT', true,
      `Displacement confirmed — ATR×${displacementEvent.atrMultiple.toFixed(2)}, body ratio ${(displacementEvent.bodyRatio * 100).toFixed(0)}%`, config));
  } else {
    reasons.push(makeReason('DISPLACEMENT', false, 'Displacement not yet confirmed', config));
  }

  // ─── Check Candle Confirmation ─────────────────────────────────────────
  const relevantPattern = findRelevantPattern(patterns, htfDirection);

  if (relevantPattern) {
    reasons.push(makeReason('CONFIRMATION', true,
      `${formatPatternName(relevantPattern.pattern)} confirmation at ${relevantPattern.candle.close.toFixed(2)}`, config));
  } else {
    reasons.push(makeReason('CONFIRMATION', false, 'Candlestick confirmation pending', config));
  }

  // ─── Score Calculation ─────────────────────────────────────────────────
  const totalScore = reasons.reduce((sum, r) => sum + r.score, 0);

  // ─── Entry / Stop / Target Calculation ─────────────────────────────────
  let entry: number | null = null;
  let stopLoss: number | null = null;
  let takeProfits: TakeProfitLevel[] = [];
  let riskReward: number | null = null;
  let invalidationPrice: number | null = null;
  let invalidationCondition: string | null = null;
  let setupType: SetupType | null = null;

  // Determine setup type
  if (htfDirection && activeZone && ltfStructureEvent) {
    if (ltfStructureEvent.type === 'CHOCH') {
      setupType = htfDirection === 'BUY' ? 'REVERSAL' : 'REVERSAL';
    } else if (ltfStructureEvent.type === 'BOS') {
      setupType = htfDirection === 'BUY' ? 'DEMAND_RETEST' : 'SUPPLY_RETEST';
    }
    if (activeZone.type === 'DEMAND' && htfDirection === 'BUY') {
      setupType = 'DEMAND_RETEST';
    } else if (activeZone.type === 'SUPPLY' && htfDirection === 'SELL') {
      setupType = 'SUPPLY_RETEST';
    }
  }

  if (htfDirection && totalScore >= config.signal.minimumScore) {
    entry = currentPrice;

    if (htfDirection === 'BUY') {
      const stopRef = activeZone ? activeZone.low : (latestClosed15M ? latestClosed15M.low : currentPrice * 0.995);
      stopLoss = stopRef - (atr15M * config.risk.stopBufferAtr);
      invalidationPrice = stopLoss;
      invalidationCondition = `15M close below ${stopLoss.toFixed(2)}`;

      const risk = entry - stopLoss;
      if (risk > 0) {
        takeProfits = generateTargets(entry, risk, htfDirection, swings15M, liquidityLevels);
        riskReward = takeProfits.length > 1 ? takeProfits[1].rMultiple : (takeProfits.length > 0 ? takeProfits[0].rMultiple : null);
      }
    } else {
      const stopRef = activeZone ? activeZone.high : (latestClosed15M ? latestClosed15M.high : currentPrice * 1.005);
      stopLoss = stopRef + (atr15M * config.risk.stopBufferAtr);
      invalidationPrice = stopLoss;
      invalidationCondition = `15M close above ${stopLoss.toFixed(2)}`;

      const risk = stopLoss - entry;
      if (risk > 0) {
        takeProfits = generateTargets(entry, risk, htfDirection, swings15M, liquidityLevels);
        riskReward = takeProfits.length > 1 ? takeProfits[1].rMultiple : (takeProfits.length > 0 ? takeProfits[0].rMultiple : null);
      }
    }
  }

  // ─── R:R Gate ──────────────────────────────────────────────────────────
  if (riskReward !== null && riskReward >= config.risk.minimumRR) {
    reasons.push(makeReason('RISK', true, `R:R ${riskReward.toFixed(1)} meets minimum ${config.risk.minimumRR}`, config));
  } else if (riskReward !== null) {
    reasons.push(makeReason('RISK', false, `R:R ${riskReward.toFixed(1)} below minimum ${config.risk.minimumRR}`, config));
    warnings.push('Risk/reward below minimum threshold');
  } else {
    reasons.push(makeReason('RISK', false, 'Unable to calculate R:R — no valid levels', config));
  }

  // ─── Final Score & Status ──────────────────────────────────────────────
  const finalScore = reasons.reduce((sum, r) => sum + r.score, 0);

  let status: SignalStatus = 'NO_TRADE';
  let qualityTier: SignalQualityTier = 'NO_TRADE';
  let lifecycle: SignalLifecycle = 'DETECTED';

  const rrValid = riskReward !== null && riskReward >= config.risk.minimumRR;
  const passedReasons = reasons.filter(r => r.passed);

  if (finalScore >= config.signal.highConfluenceScore && rrValid && htfDirection) {
    status = htfDirection === 'BUY' ? 'STRONG_BUY' : 'STRONG_SELL';
    qualityTier = 'HIGH_CONFLUENCE';
    lifecycle = 'CONFIRMED';
  } else if (finalScore >= config.signal.minimumScore && rrValid && htfDirection) {
    status = htfDirection === 'BUY' ? 'BUY' : 'SELL';
    qualityTier = 'VALID';
    lifecycle = 'CONFIRMED';
  } else if (htfDirection && passedReasons.length >= 2) {
    status = 'WAIT';
    qualityTier = 'WATCH';
    lifecycle = 'DETECTED';
    // Clear entry/stop if not confirmed
    entry = null;
    stopLoss = null;
    takeProfits = [];
    riskReward = null;
  } else {
    status = 'NO_TRADE';
    qualityTier = 'NO_TRADE';
    lifecycle = 'DETECTED';
    entry = null;
    stopLoss = null;
    takeProfits = [];
    riskReward = null;
  }

  // ─── Build Result ──────────────────────────────────────────────────────
  return {
    id: generateSignalId(),
    status,
    direction: htfDirection,
    symbol,
    higherTimeframe: config.higherTimeframe,
    executionTimeframe: config.executionTimeframe,
    setupType,
    timestamp,
    entry,
    stopLoss,
    takeProfits,
    riskReward,
    invalidationPrice,
    invalidationCondition,
    expiryTimestamp: timestamp + (config.signal.maxExpiryBars * 15 * 60 * 1000), // 15M bars
    expiryCandles: config.signal.maxExpiryBars,
    confidence: Math.min(100, finalScore),
    qualityTier,
    reasons,
    warnings,
    lifecycle,
    strategyVersion: config.version,
    dataSource,
    htfBias: bias,
    activeZone: activeZone ?? null,
    activeLiquiditySweep: recentSweep ?? null,
    structureEvent: ltfStructureEvent ?? null,
    displacement: displacementEvent ?? null,
    candleConfirmation: relevantPattern ?? null,
    currentSession,
  };
}

// ─── Generate Setup Checklist ────────────────────────────────────────────────

export function generateChecklist(signal: SignalResult): SetupChecklist {
  const reasonMap = new Map<ReasonCategory, SignalReason>();
  for (const r of signal.reasons) {
    if (!reasonMap.has(r.category) || r.passed) {
      reasonMap.set(r.category, r);
    }
  }

  const makeItem = (category: ReasonCategory, label: string): ChecklistItem => {
    const r = reasonMap.get(category);
    if (!r) return { label, status: 'NA', detail: 'Not evaluated' };
    return {
      label,
      status: r.passed ? 'PASSED' : 'WAITING',
      detail: r.message,
    };
  };

  return {
    htfTrend: makeItem('HTF_STRUCTURE', '4H Trend'),
    htfStructure: {
      label: '4H Structure',
      status: signal.htfBias?.bias === 'BULLISH' || signal.htfBias?.bias === 'BEARISH' ? 'PASSED' : 'WAITING',
      detail: signal.htfBias ? `${signal.htfBias.bias}` : 'Pending',
    },
    keyZone: makeItem('ZONE', 'Key Zone'),
    liquidity: makeItem('LIQUIDITY', 'Liquidity'),
    ltfStructure: makeItem('STRUCTURE', '15M Structure'),
    displacement: makeItem('DISPLACEMENT', 'Displacement'),
    retest: {
      label: 'Retest',
      status: signal.activeZone ? 'PASSED' : 'WAITING',
      detail: signal.activeZone ? `Price at ${signal.activeZone.type.toLowerCase()} zone` : 'Waiting for retest',
    },
    candleConfirmation: makeItem('CONFIRMATION', 'Candle Confirmation'),
    riskCheck: makeItem('RISK', 'Risk Check'),
    signalStatus: signal.status,
  };
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function makeReason(category: ReasonCategory, passed: boolean, message: string, config: StrategyConfig): SignalReason {
  const weight = config.scoring.weights[category];
  return {
    category,
    passed,
    message,
    weight,
    score: passed ? weight : 0,
  };
}

function createNoSignal(
  symbol: string, config: StrategyConfig, timestamp: number,
  dataSource: string, status: SignalStatus,
  reasons: SignalReason[], warnings: string[]
): SignalResult {
  return {
    id: generateSignalId(),
    status,
    direction: null,
    symbol,
    higherTimeframe: config.higherTimeframe,
    executionTimeframe: config.executionTimeframe,
    setupType: null,
    timestamp,
    entry: null,
    stopLoss: null,
    takeProfits: [],
    riskReward: null,
    invalidationPrice: null,
    invalidationCondition: null,
    expiryTimestamp: null,
    expiryCandles: null,
    confidence: 0,
    qualityTier: 'NO_TRADE',
    reasons,
    warnings,
    lifecycle: 'DETECTED',
    strategyVersion: config.version,
    dataSource,
    htfBias: null,
    activeZone: null,
    activeLiquiditySweep: null,
    structureEvent: null,
    displacement: null,
    candleConfirmation: null,
    currentSession: getCurrentSession(timestamp),
  };
}

function findActiveZone(zones: Zone[], price: number, direction: SignalDirection | null): Zone | undefined {
  const validZones = zones
    .filter(z => z.state === 'FRESH' || z.state === 'TESTED')
    .filter(z => {
      if (direction === 'BUY') return z.type === 'DEMAND' && price >= z.low && price <= z.high * 1.002;
      if (direction === 'SELL') return z.type === 'SUPPLY' && price <= z.high && price >= z.low * 0.998;
      return price >= z.low && price <= z.high;
    })
    .sort((a, b) => b.quality.score - a.quality.score);

  return validZones[0];
}

function findRecentSweep(sweeps: LiquiditySweep[], direction: SignalDirection | null): LiquiditySweep | undefined {
  if (!direction) return undefined;

  const relevant = sweeps.filter(s => {
    if (direction === 'BUY') return s.liquidityLevel.type === 'SELL_SIDE';
    return s.liquidityLevel.type === 'BUY_SIDE';
  });

  return relevant[relevant.length - 1];
}

function findRelevantStructureEvent(events: StructureEvent[], direction: SignalDirection | null): StructureEvent | undefined {
  if (!direction) return undefined;

  const relevant = events.filter(e => {
    if (direction === 'BUY') return e.direction === 'BULLISH' && (e.type === 'BOS' || e.type === 'CHOCH');
    return e.direction === 'BEARISH' && (e.type === 'BOS' || e.type === 'CHOCH');
  });

  return relevant[relevant.length - 1];
}

function findRelevantPattern(patterns: CandlePatternEvent[], direction: SignalDirection | null): CandlePatternEvent | undefined {
  if (!direction) return undefined;

  return patterns.find(p => {
    if (direction === 'BUY') return p.direction === 'BULLISH';
    return p.direction === 'BEARISH';
  });
}

function generateTargets(
  entry: number, risk: number, direction: SignalDirection,
  swings: SwingPoint[], liquidityLevels: LiquidityLevel[]
): TakeProfitLevel[] {
  const targets: TakeProfitLevel[] = [];

  if (direction === 'BUY') {
    // TP1: 1.5R
    const tp1 = entry + (risk * 1.5);
    targets.push({ level: 1, price: tp1, rMultiple: 1.5, description: '1.5R target' });

    // TP2: Next resistance/liquidity or 2.5R
    const nearbyResistance = liquidityLevels
      .filter(l => l.type === 'BUY_SIDE' && l.price > entry)
      .sort((a, b) => a.price - b.price)[0];

    const tp2Price = nearbyResistance ? nearbyResistance.price : entry + (risk * 2.5);
    const tp2R = (tp2Price - entry) / risk;
    targets.push({ level: 2, price: tp2Price, rMultiple: Math.round(tp2R * 10) / 10, description: nearbyResistance ? 'Buy-side liquidity target' : '2.5R target' });

    // TP3: Extended or 4R
    const tp3 = entry + (risk * 4);
    targets.push({ level: 3, price: tp3, rMultiple: 4, description: 'Extended target' });
  } else {
    // TP1: 1.5R
    const tp1 = entry - (risk * 1.5);
    targets.push({ level: 1, price: tp1, rMultiple: 1.5, description: '1.5R target' });

    // TP2: Next support/liquidity or 2.5R
    const nearbySupport = liquidityLevels
      .filter(l => l.type === 'SELL_SIDE' && l.price < entry)
      .sort((a, b) => b.price - a.price)[0];

    const tp2Price = nearbySupport ? nearbySupport.price : entry - (risk * 2.5);
    const tp2R = (entry - tp2Price) / risk;
    targets.push({ level: 2, price: tp2Price, rMultiple: Math.round(tp2R * 10) / 10, description: nearbySupport ? 'Sell-side liquidity target' : '2.5R target' });

    // TP3: Extended or 4R
    const tp3 = entry - (risk * 4);
    targets.push({ level: 3, price: tp3, rMultiple: 4, description: 'Extended target' });
  }

  return targets;
}

function formatPatternName(pattern: string): string {
  return pattern.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

let signalCounter = 0;
function generateSignalId(): string {
  signalCounter++;
  const now = new Date();
  const year = now.getFullYear();
  return `SIG-${year}-${String(signalCounter).padStart(5, '0')}`;
}
