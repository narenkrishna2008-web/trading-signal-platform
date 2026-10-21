'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, Clock, Target, ArrowUpRight, ArrowDownRight, Layers, CheckCircle2, XCircle, AlertTriangle, Crosshair } from 'lucide-react';
import type { SignalResult, Zone } from '@/lib/types/strategy';
import type { Candle, Timeframe } from '@/lib/types/market';
import { ZoneChart } from '@/components/chart/ZoneChart';

interface SignalCardProps {
  signal?: SignalResult | null;
  currentPrice?: number;
  bars?: Candle[];
  timeframe?: Timeframe;
}

export function SignalCard({ signal, currentPrice, bars = [], timeframe = '15M' }: SignalCardProps) {
  if (!signal) {
    return (
      <Card className="h-full flex flex-col justify-center items-center p-8 text-center bg-slate-950 border-slate-800">
        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 animate-pulse">
          Σ
        </div>
        <div className="text-xl font-bold text-slate-300 mb-1">EVALUATING MARKET</div>
        <p className="text-xs text-slate-500 max-w-sm">
          Scanning multi-timeframe structure, liquidity sweeps, and supply/demand zones on {timeframe}...
        </p>
      </Card>
    );
  }

  const isBuy = signal.status.includes('BUY');
  const isSell = signal.status.includes('SELL');
  const isWait = signal.status === 'WAIT';
  const isConfirmed = (isBuy || isSell) && (signal.lifecycle === 'CONFIRMED' || signal.lifecycle === 'ACTIVE');

  const statusColor = isConfirmed
    ? isBuy ? 'text-emerald-400' : 'text-red-400'
    : isWait
    ? 'text-amber-400'
    : 'text-slate-400';

  const htfBiasStr = signal.htfBias?.bias || 'NEUTRAL';
  const winProbability = Math.min(96, Math.max(12, signal.confidence));

  // Format timestamp in IST
  const istDateStr = signal.timestamp
    ? new Date(signal.timestamp).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' IST'
    : '';

  const zone: Zone | null = signal.activeZone || null;

  return (
    <Card className="flex flex-col bg-slate-950 border-slate-800 shadow-2xl overflow-hidden rounded-xl">
      {/* 1. Header Banner */}
      <CardHeader className="p-4 pb-3 border-b border-slate-800 bg-slate-900/70 shrink-0">
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
          {/* Symbol + Timeframe */}
          <div className="flex items-center space-x-2">
            <span className="font-black text-base tracking-wider text-slate-100">{signal.symbol}</span>
            <span className="text-slate-600">·</span>
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold">
              <Layers className="w-3 h-3 mr-1" />
              <span>TIMEFRAME: {signal.executionTimeframe || timeframe} EXECUTION</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
              (Higher Timeframe: {signal.higherTimeframe || '4H'} Bias)
            </span>
          </div>

          {/* Badges & IST Timestamp */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              🕒 {istDateStr}
            </span>
            <Badge variant={htfBiasStr === 'BULLISH' ? 'bullish' : htfBiasStr === 'BEARISH' ? 'bearish' : 'neutral'}>
              4H {htfBiasStr}
            </Badge>
            <Badge variant="outline">{signal.qualityTier}</Badge>
          </div>
        </div>

        {/* 2. Main Signal Decision Banner */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <span>Strategy Decision</span>
              {isConfirmed && (
                <span className="text-emerald-400 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30">
                  ✓ CANDLE CLOSED & CONFIRMED
                </span>
              )}
              {isWait && (
                <span className="text-amber-400 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30">
                  ⏳ AWAITING CONFIRMATION CANDLE
                </span>
              )}
            </div>

            <div className={`text-3xl font-black tracking-tight flex items-center space-x-2 mt-0.5 ${statusColor}`}>
              <span>
                {isConfirmed
                  ? (isBuy ? 'CONFIRMED BUY SIGNAL' : 'CONFIRMED SELL SIGNAL')
                  : isWait
                  ? 'DEVELOPING SETUP (WAIT)'
                  : 'NO ACTIVE TRADE'}
              </span>
              {isBuy && <ArrowUpRight className="w-7 h-7 stroke-[3]" />}
              {isSell && <ArrowDownRight className="w-7 h-7 stroke-[3]" />}
            </div>
          </div>

          {/* Win Probability Box */}
          <div className="p-2.5 px-3.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Win Probability
            </span>
            <div className="flex items-baseline space-x-1">
              <span className={`text-3xl font-black font-mono ${
                winProbability >= 70 ? 'text-emerald-400' :
                winProbability >= 50 ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {winProbability}%
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">
              Calculated across all confluence variables
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs overflow-y-auto">
        {/* 3. Visual Supply/Demand Zone & Order Placement Chart */}
        {bars && bars.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-300">
              <span className="flex items-center space-x-1.5 text-amber-400">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Zone Location & Order Placement on Chart</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                TradingView Candlestick Visualizer
              </span>
            </div>
            <ZoneChart bars={bars} signal={signal} height={190} />
          </div>
        )}

        {/* 4. Execution Parameters (Target Entry, Stop Loss, Take Profits) */}
        {signal.entry && signal.stopLoss ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Entry Price */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-blue-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                    Place Order (Entry)
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-blue-500/10 text-blue-300">
                    {signal.direction}
                  </span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-100 mt-1">
                  ${signal.entry.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Current Price: ${currentPrice ? currentPrice.toFixed(2) : signal.entry.toFixed(2)}
                </div>
              </div>

              {/* Stop Loss */}
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/40">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                    Stop Loss (Invalidation)
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-red-500/10 text-red-300">
                    PROTECTION
                  </span>
                </div>
                <div className="text-xl font-mono font-bold text-red-400 mt-1">
                  ${signal.stopLoss.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Risk: ${Math.abs(signal.entry - signal.stopLoss).toFixed(2)} / ounce
                </div>
              </div>

              {/* Risk:Reward */}
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Risk : Reward Ratio
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/10 text-emerald-300 font-bold">
                    MIN 1:2.0
                  </span>
                </div>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                  1 : {signal.riskReward ? signal.riskReward.toFixed(1) : '2.0+'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  High mathematical expectancy
                </div>
              </div>
            </div>

            {/* Take Profit Target Hierarchy */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Take Profit Orders</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Multiple Target Exit Strategy
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
                {signal.takeProfits && signal.takeProfits.length > 0 ? (
                  signal.takeProfits.map((tp) => (
                    <div
                      key={tp.level}
                      className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">Target {tp.level} (TP{tp.level})</span>
                        <span className="text-[10px] font-bold text-emerald-400 px-1 py-0.2 rounded bg-emerald-500/10">
                          {tp.rMultiple}R Multiple
                        </span>
                      </div>
                      <div className="text-base font-bold text-emerald-400 mt-1">
                        ${tp.price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        {tp.description}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs italic">Targets computed on order activation</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Waiting State Banner */
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {isWait
                  ? 'ONGOING TRADE DETECTED — WAITING FOR CANDLE CONFIRMATION'
                  : 'NO ACTIONABLE INSTITUTIONAL EDGE DETECTED'}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {isWait
                ? `A trade setup is actively forming on ${signal.executionTimeframe}. Per institutional rules, orders will ONLY be issued once the confirmation candle closes.`
                : 'Market conditions do not currently provide confluence across HTF structure and key zones. Preserving capital is top priority.'}
            </p>
            {signal.warnings.length > 0 && (
              <div className="pt-1 text-[11px] text-amber-400/90 font-mono space-y-0.5">
                {signal.warnings.map((w, i) => (
                  <div key={i}>⚠ {w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Supply & Demand Zone Specifics */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Institutional Supply / Demand Zone
            </span>
            {zone && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                zone.type === 'DEMAND' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {zone.type} ZONE
              </span>
            )}
          </div>

          {zone ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Zone Top:</span>
                <span className="font-bold text-slate-200">${zone.high.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Zone Bottom:</span>
                <span className="font-bold text-slate-200">${zone.low.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Freshness:</span>
                <span className="font-bold text-amber-400">{zone.state} ({zone.touches} touches)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans">Timeframe:</span>
                <span className="font-bold text-slate-200">{zone.timeframe || signal.higherTimeframe}</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs italic">
              No immediate unmitigated zone touched. Scanning next structural key level.
            </div>
          )}
        </div>

        {/* 6. Win Probability Variable Breakdown (Audit Trail) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Confluence Variables Breakdown ({winProbability}% Win Probability)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {signal.reasons.filter(r => r.passed).length} of {signal.reasons.length} Passed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {signal.reasons.map((r, i) => (
              <div
                key={i}
                className={`flex items-start space-x-2 p-2 rounded text-[11px] border ${
                  r.passed
                    ? 'bg-slate-900/60 border-emerald-900/30 text-slate-200'
                    : 'bg-slate-950 border-slate-900 text-slate-500'
                }`}
              >
                {r.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-[9px] uppercase px-1 rounded bg-slate-800 text-slate-400 font-semibold">
                      {r.category.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      +{r.score}/{r.weight} pts
                    </span>
                  </div>
                  <span className="leading-tight mt-0.5 text-xs">{r.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Footer Stamp */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap justify-between items-center text-[10px] text-slate-500 font-mono gap-1">
          <span>Engine: {signal.strategyVersion} · Closed Bar Verification</span>
          <span>Feed: {signal.dataSource}</span>
          <span>Timestamp: {istDateStr}</span>
        </div>
      </CardContent>
    </Card>
  );
}
