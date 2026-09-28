/**
 * Chronological Replay Backtesting Engine
 * 
 * Executes an exact, deterministic backtest by advancing candle-by-candle through historical data.
 * STRICT ANTI-LOOKAHEAD GUARANTEES:
 * - Only historical bars up to current replay step timestamp are provided to strategy engine.
 * - Future bars are strictly isolated.
 * - Conservative tie-breaking: If Stop Loss and Target are both touched on the same candle,
 *   the stop loss is assumed to have occurred first (pessimistic / realistic execution).
 * - Models spread, slippage, and position sizing.
 */

import { Candle, Timeframe } from '../types/market';
import {
  BacktestConfig, BacktestResult, BacktestMetrics, BacktestTrade,
  StrategyConfig, DEFAULT_STRATEGY_CONFIG, SignalResult, SignalDirection, SetupType
} from '../types/strategy';
import { evaluateMarket } from './signal-engine';

export interface RunBacktestOptions {
  symbol?: string;
  bars4H: Candle[];
  bars15M: Candle[];
  startingBalance?: number;
  riskPerTradePct?: number;
  spread?: number;
  slippage?: number;
  strategyConfig?: StrategyConfig;
}

export function runBacktest(options: RunBacktestOptions): BacktestResult {
  const {
    symbol = 'XAU/USD',
    bars4H,
    bars15M,
    startingBalance = 10000,
    riskPerTradePct = 1.0,
    spread = 0.20,
    slippage = 0.05,
    strategyConfig = DEFAULT_STRATEGY_CONFIG,
  } = options;

  const now = Date.now();
  const sorted4H = [...bars4H].sort((a, b) => a.timestamp - b.timestamp);
  const sorted15M = [...bars15M].sort((a, b) => a.timestamp - b.timestamp);

  // Require minimum lookback for 4H and 15M structure detection
  const minLookback15M = 35;
  if (sorted15M.length <= minLookback15M || sorted4H.length < 15) {
    return createEmptyResult(symbol, startingBalance, strategyConfig);
  }

  const trades: BacktestTrade[] = [];
  let balance = startingBalance;
  let peakBalance = startingBalance;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  // Active position tracker (1 position at a time for clean execution modeling)
  let activePosition: {
    signalId: string;
    direction: SignalDirection;
    setupType: SetupType;
    entryPrice: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
    riskAmount: number;
    entryBarIndex: number;
    entryTime: number;
    highestPriceSinceEntry: number;
    lowestPriceSinceEntry: number;
  } | null = null;

  // Step through 15M candles one by one (Chronological Replay)
  for (let i = minLookback15M; i < sorted15M.length; i++) {
    const current15MBar = sorted15M[i];
    const currentTimestamp = current15MBar.timestamp;

    // ─── 1. Manage Existing Open Position ───────────────────────────────────
    if (activePosition) {
      const pos = activePosition;
      pos.highestPriceSinceEntry = Math.max(pos.highestPriceSinceEntry, current15MBar.high);
      pos.lowestPriceSinceEntry = Math.min(pos.lowestPriceSinceEntry, current15MBar.low);

      let closed = false;
      let exitPrice = 0;
      let exitReason = '';
      let outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' = 'LOSS';
      let rMultiple = 0;

      if (pos.direction === 'BUY') {
        const stopTouched = current15MBar.low <= pos.stopLoss;
        const tp2Touched = current15MBar.high >= pos.takeProfit2;

        // Conservative tie-breaker: if both hit in the same bar, assume stop was hit first!
        if (stopTouched && tp2Touched) {
          closed = true;
          exitPrice = pos.stopLoss;
          exitReason = 'Stop loss hit (Intrabar adverse tie)';
          outcome = 'LOSS';
          rMultiple = -1.0;
        } else if (stopTouched) {
          closed = true;
          exitPrice = pos.stopLoss;
          exitReason = 'Stop loss triggered';
          outcome = 'LOSS';
          rMultiple = -1.0;
        } else if (tp2Touched) {
          closed = true;
          exitPrice = pos.takeProfit2;
          exitReason = 'Take Profit 2 triggered (2.5R target)';
          outcome = 'WIN';
          rMultiple = 2.5;
        } else if (i - pos.entryBarIndex >= 32) {
          // Time-based exit after 8 hours (32 x 15M bars)
          closed = true;
          exitPrice = current15MBar.close;
          exitReason = 'Time-decay trade exit';
          rMultiple = (exitPrice - pos.entryPrice) / (pos.entryPrice - pos.stopLoss);
          outcome = rMultiple > 0.5 ? 'WIN' : rMultiple < -0.5 ? 'LOSS' : 'BREAKEVEN';
        }
      } else {
        // SELL Position
        const stopTouched = current15MBar.high >= pos.stopLoss;
        const tp2Touched = current15MBar.low <= pos.takeProfit2;

        if (stopTouched && tp2Touched) {
          closed = true;
          exitPrice = pos.stopLoss;
          exitReason = 'Stop loss hit (Intrabar adverse tie)';
          outcome = 'LOSS';
          rMultiple = -1.0;
        } else if (stopTouched) {
          closed = true;
          exitPrice = pos.stopLoss;
          exitReason = 'Stop loss triggered';
          outcome = 'LOSS';
          rMultiple = -1.0;
        } else if (tp2Touched) {
          closed = true;
          exitPrice = pos.takeProfit2;
          exitReason = 'Take Profit 2 triggered (2.5R target)';
          outcome = 'WIN';
          rMultiple = 2.5;
        } else if (i - pos.entryBarIndex >= 32) {
          closed = true;
          exitPrice = current15MBar.close;
          exitReason = 'Time-decay trade exit';
          rMultiple = (pos.entryPrice - exitPrice) / (pos.stopLoss - pos.entryPrice);
          outcome = rMultiple > 0.5 ? 'WIN' : rMultiple < -0.5 ? 'LOSS' : 'BREAKEVEN';
        }
      }

      if (closed) {
        const riskDistance = Math.abs(pos.entryPrice - pos.stopLoss);
        const pnl = pos.riskAmount * rMultiple;
        balance += pnl;

        if (balance > peakBalance) peakBalance = balance;
        const currentDd = peakBalance - balance;
        if (currentDd > maxDrawdown) {
          maxDrawdown = currentDd;
          maxDrawdownPct = (maxDrawdown / peakBalance) * 100;
        }

        const mfe = pos.direction === 'BUY'
          ? (pos.highestPriceSinceEntry - pos.entryPrice) / riskDistance
          : (pos.entryPrice - pos.lowestPriceSinceEntry) / riskDistance;

        const mae = pos.direction === 'BUY'
          ? (pos.entryPrice - pos.lowestPriceSinceEntry) / riskDistance
          : (pos.highestPriceSinceEntry - pos.entryPrice) / riskDistance;

        trades.push({
          signalId: pos.signalId,
          direction: pos.direction,
          setupType: pos.setupType,
          entryPrice: pos.entryPrice,
          entryTime: pos.entryTime,
          exitPrice: Number(exitPrice.toFixed(2)),
          exitTime: current15MBar.timestamp,
          stopLoss: pos.stopLoss,
          takeProfits: [
            { level: 1, price: pos.takeProfit1, rMultiple: 1.5, description: 'TP1' },
            { level: 2, price: pos.takeProfit2, rMultiple: 2.5, description: 'TP2' },
            { level: 3, price: pos.takeProfit3, rMultiple: 4.0, description: 'TP3' },
          ],
          result: outcome,
          rMultiple: Number(rMultiple.toFixed(2)),
          pnl: Number(pnl.toFixed(2)),
          holdingBars: i - pos.entryBarIndex,
          maxFavorableExcursion: Number(mfe.toFixed(2)),
          maxAdverseExcursion: Number(mae.toFixed(2)),
          exitReason,
        });

        activePosition = null;
      }
    }

    // ─── 2. Evaluate Signals If No Active Position ───────────────────────────
    if (!activePosition) {
      // Strictly slice history up to current candle (No Lookahead!)
      const historical15M = sorted15M.slice(0, i + 1);
      const historical4H = sorted4H.filter(b => b.timestamp <= currentTimestamp);

      if (historical4H.length >= 15 && historical15M.length >= 30) {
        const signalResult = evaluateMarket({
          candles4H: historical4H,
          candles15M: historical15M,
          currentPrice: current15MBar.close,
          symbol,
          config: strategyConfig,
          dataSource: 'BACKTEST_REPLAY',
          dataFresh: true,
          macroBlackout: false,
        });

        const isSignalActionable = (signalResult.status === 'BUY' || signalResult.status === 'STRONG_BUY' ||
                                    signalResult.status === 'SELL' || signalResult.status === 'STRONG_SELL') &&
                                    signalResult.entry && signalResult.stopLoss && signalResult.direction;

        if (isSignalActionable && signalResult.direction) {
          const dir = signalResult.direction;
          const rawEntry = signalResult.entry!;
          const stop = signalResult.stopLoss!;
          // Apply spread and slippage to entry execution
          const executedEntry = dir === 'BUY'
            ? rawEntry + spread + slippage
            : rawEntry - (spread + slippage);

          const riskAmount = balance * (riskPerTradePct / 100);
          const tp1 = signalResult.takeProfits[0]?.price || (dir === 'BUY' ? executedEntry + 15 : executedEntry - 15);
          const tp2 = signalResult.takeProfits[1]?.price || (dir === 'BUY' ? executedEntry + 25 : executedEntry - 25);
          const tp3 = signalResult.takeProfits[2]?.price || (dir === 'BUY' ? executedEntry + 40 : executedEntry - 40);

          activePosition = {
            signalId: signalResult.id,
            direction: dir,
            setupType: signalResult.setupType || 'DEMAND_RETEST',
            entryPrice: Number(executedEntry.toFixed(2)),
            stopLoss: Number(stop.toFixed(2)),
            takeProfit1: Number(tp1.toFixed(2)),
            takeProfit2: Number(tp2.toFixed(2)),
            takeProfit3: Number(tp3.toFixed(2)),
            riskAmount,
            entryBarIndex: i,
            entryTime: currentTimestamp,
            highestPriceSinceEntry: executedEntry,
            lowestPriceSinceEntry: executedEntry,
          };
        }
      }
    }
  }

  // ─── 3. Compute Backtest Metrics ──────────────────────────────────────────
  const metrics = calculateMetrics(trades, startingBalance, balance, maxDrawdown, maxDrawdownPct);

  const backtestConfig: BacktestConfig = {
    symbol,
    dateFrom: sorted15M[0].timestamp,
    dateTo: sorted15M[sorted15M.length - 1].timestamp,
    startingBalance,
    riskPerTrade: riskPerTradePct,
    spread,
    slippage,
    minimumRR: strategyConfig.risk.minimumRR,
    sessionFilter: strategyConfig.session.enabled,
    newsBlackout: false,
    strategyConfig,
    setupTypes: ['DEMAND_RETEST', 'SUPPLY_RETEST', 'BREAKOUT_CONTINUATION', 'REVERSAL'],
    directions: ['BUY', 'SELL'],
  };

  return {
    id: `BT-${Date.now()}`,
    config: backtestConfig,
    metrics,
    trades,
    strategyVersion: strategyConfig.version,
    completedAt: now,
  };
}

function calculateMetrics(
  trades: BacktestTrade[],
  startingBalance: number,
  endingBalance: number,
  maxDrawdown: number,
  maxDrawdownPct: number
): BacktestMetrics {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      profitFactor: 0,
      expectancy: 0,
      netResult: 0,
      netResultPercent: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      averageR: 0,
      largestWin: 0,
      largestLoss: 0,
      averageHoldingBars: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      longWins: 0,
      longLosses: 0,
      shortWins: 0,
      shortLosses: 0,
      breakoutWins: 0,
      breakoutLosses: 0,
      reversalWins: 0,
      reversalLosses: 0,
      maxFavorableExcursion: 0,
      maxAdverseExcursion: 0,
    };
  }

  const wins = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');

  const winRate = Number(((wins.length / totalTrades) * 100).toFixed(1));
  const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.0 : 0;

  const netResult = Number((endingBalance - startingBalance).toFixed(2));
  const netResultPercent = Number(((netResult / startingBalance) * 100).toFixed(2));

  const totalR = trades.reduce((acc, t) => acc + t.rMultiple, 0);
  const averageR = Number((totalR / totalTrades).toFixed(2));
  const expectancy = Number(((winRate / 100 * (grossProfit / (wins.length || 1))) - ((1 - winRate / 100) * (grossLoss / (losses.length || 1)))).toFixed(2));

  let maxConsecWins = 0, currentConsecWins = 0;
  let maxConsecLosses = 0, currentConsecLosses = 0;

  for (const t of trades) {
    if (t.result === 'WIN') {
      currentConsecWins++;
      currentConsecLosses = 0;
      if (currentConsecWins > maxConsecWins) maxConsecWins = currentConsecWins;
    } else if (t.result === 'LOSS') {
      currentConsecLosses++;
      currentConsecWins = 0;
      if (currentConsecLosses > maxConsecLosses) maxConsecLosses = currentConsecLosses;
    }
  }

  const totalHoldingBars = trades.reduce((acc, t) => acc + t.holdingBars, 0);
  const avgHoldingBars = Math.round(totalHoldingBars / totalTrades);

  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0;

  const avgMfe = Number((trades.reduce((acc, t) => acc + t.maxFavorableExcursion, 0) / totalTrades).toFixed(2));
  const avgMae = Number((trades.reduce((acc, t) => acc + t.maxAdverseExcursion, 0) / totalTrades).toFixed(2));

  return {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    winRate,
    profitFactor,
    expectancy,
    netResult,
    netResultPercent,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPct.toFixed(2)),
    averageR,
    largestWin: Number(largestWin.toFixed(2)),
    largestLoss: Number(largestLoss.toFixed(2)),
    averageHoldingBars: avgHoldingBars,
    consecutiveWins: maxConsecWins,
    consecutiveLosses: maxConsecLosses,
    longWins: wins.filter(t => t.direction === 'BUY').length,
    longLosses: losses.filter(t => t.direction === 'BUY').length,
    shortWins: wins.filter(t => t.direction === 'SELL').length,
    shortLosses: losses.filter(t => t.direction === 'SELL').length,
    breakoutWins: wins.filter(t => t.setupType === 'BREAKOUT_CONTINUATION').length,
    breakoutLosses: losses.filter(t => t.setupType === 'BREAKOUT_CONTINUATION').length,
    reversalWins: wins.filter(t => t.setupType === 'REVERSAL' || t.setupType.includes('RETEST')).length,
    reversalLosses: losses.filter(t => t.setupType === 'REVERSAL' || t.setupType.includes('RETEST')).length,
    maxFavorableExcursion: avgMfe,
    maxAdverseExcursion: avgMae,
  };
}

function createEmptyResult(symbol: string, balance: number, config: StrategyConfig): BacktestResult {
  return {
    id: `BT-${Date.now()}`,
    config: {
      symbol,
      dateFrom: Date.now() - 86400000,
      dateTo: Date.now(),
      startingBalance: balance,
      riskPerTrade: 1,
      spread: 0.2,
      slippage: 0.05,
      minimumRR: 2,
      sessionFilter: false,
      newsBlackout: false,
      strategyConfig: config,
      setupTypes: ['DEMAND_RETEST', 'SUPPLY_RETEST'],
      directions: ['BUY', 'SELL'],
    },
    metrics: calculateMetrics([], balance, balance, 0, 0),
    trades: [],
    strategyVersion: config.version,
    completedAt: Date.now(),
  };
}
