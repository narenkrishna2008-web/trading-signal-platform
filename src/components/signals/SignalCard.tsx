'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldAlert, Clock, Target, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { SignalResult } from '@/lib/types/strategy';

interface SignalCardProps {
  signal?: SignalResult | null;
  currentPrice?: number;
}

export function SignalCard({ signal, currentPrice }: SignalCardProps) {
  if (!signal) {
    return (
      <Card className="h-full flex flex-col justify-center items-center p-6 text-center bg-slate-950 border-slate-800">
        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 animate-pulse">
          Σ
        </div>
        <div className="text-xl font-bold text-slate-300 mb-1">EVALUATING MARKET</div>
        <p className="text-xs text-slate-500 max-w-xs">
          Scanning 4H structure and 15M supply/demand zones for valid trade setups...
        </p>
      </Card>
    );
  }

  const isBuy = signal.status.includes('BUY');
  const isSell = signal.status.includes('SELL');
  const isWait = signal.status === 'WAIT';
  const isNoTrade = signal.status === 'NO_TRADE' || signal.status === 'DATA_STALE' || signal.status === 'MARKET_UNAVAILABLE';

  const statusColor = isBuy
    ? 'text-emerald-400'
    : isSell
    ? 'text-red-400'
    : isWait
    ? 'text-amber-400'
    : 'text-slate-400';

  const statusBg = isBuy
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : isSell
    ? 'bg-red-500/10 border-red-500/30'
    : isWait
    ? 'bg-amber-500/10 border-amber-500/30'
    : 'bg-slate-900 border-slate-800';

  const htfBiasStr = signal.htfBias?.bias || 'NEUTRAL';

  return (
    <Card className="h-full flex flex-col bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
      {/* Top Banner */}
      <CardHeader className="p-4 pb-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold tracking-wider text-slate-200">{signal.symbol}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono">15M EXEC</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Badge variant={isBuy ? 'bullish' : isSell ? 'bearish' : 'neutral'}>
              4H {htfBiasStr}
            </Badge>
            <Badge variant="outline">{signal.qualityTier}</Badge>
          </div>
        </div>

        {/* Large Status Display */}
        <div className="mt-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              System Signal Decision
            </div>
            <div className={`text-3xl font-black tracking-tight flex items-center space-x-1 ${statusColor}`}>
              <span>{signal.status.replace(/_/g, ' ')}</span>
              {isBuy && <ArrowUpRight className="w-6 h-6 stroke-[3]" />}
              {isSell && <ArrowDownRight className="w-6 h-6 stroke-[3]" />}
            </div>
          </div>

          {/* Confidence Score Gauge */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Confluence</span>
            <div className="flex items-baseline space-x-0.5">
              <span className={`text-2xl font-black font-mono ${
                signal.confidence >= 75 ? 'text-emerald-400' :
                signal.confidence >= 50 ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {signal.confidence}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/100</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-850 rounded-full mt-2 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              isBuy ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
              isSell ? 'bg-gradient-to-r from-red-600 to-red-400' :
              isWait ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-slate-700'
            }`}
            style={{ width: `${Math.max(8, signal.confidence)}%` }}
          />
        </div>
      </CardHeader>

      {/* Main Execution Parameters or Wait State */}
      <CardContent className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {/* If Active Signal (BUY / SELL) */}
        {(isBuy || isSell) && signal.entry && signal.stopLoss ? (
          <>
            {/* Key Entry / Stop Box */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Target Entry
                </span>
                <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                  ${signal.entry.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {currentPrice ? `Diff: ${(currentPrice - signal.entry).toFixed(2)}` : 'At Market/Close'}
                </div>
              </div>

              <div className="p-2.5 rounded bg-red-950/20 border border-red-900/40">
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                  Invalidation (Stop)
                </span>
                <div className="text-base font-mono font-bold text-red-400 mt-0.5">
                  ${signal.stopLoss.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Risk: ${Math.abs(signal.entry - signal.stopLoss).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Take Profit Targets */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                  <Target className="w-3 h-3 text-emerald-400" />
                  <span>Target Hierarchy</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  R:R 1:{signal.riskReward ? signal.riskReward.toFixed(1) : '2.0+'}
                </span>
              </div>

              <div className="space-y-1">
                {signal.takeProfits.map((tp) => (
                  <div
                    key={tp.level}
                    className="flex justify-between items-center p-2 rounded bg-slate-900/70 border border-slate-800/80 font-mono text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-bold">TP{tp.level}</span>
                      <span className="text-[10px] text-slate-500 font-sans">{tp.description}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">${tp.price.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 px-1 py-0.2 rounded bg-slate-800">
                        {tp.rMultiple}R
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invalidation Rules & Expiry */}
            <div className="p-2.5 rounded bg-slate-900/50 border border-slate-800 space-y-1 text-[11px]">
              <div className="flex items-start space-x-1.5 text-slate-300">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400">Invalidation Rule: </span>
                  <span className="font-semibold text-slate-200">
                    {signal.invalidationCondition || `15M close beyond $${signal.stopLoss.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                <span>Expires in {signal.expiryCandles || 12} candles (~3 hours) if untriggered</span>
              </div>
            </div>
          </>
        ) : (
          /* Waiting / No-Trade Detailed Guidance */
          <div className="p-3.5 rounded bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {isWait ? 'WAITING FOR COMPLETE CONFIRMATION' : 'NO ACTIONABLE TRADE EDGE'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {isWait
                ? 'A high-probability price-action setup is forming. The system requires candle close confirmation and minimum displacement before entry activation.'
                : 'Market conditions do not currently provide a clean institutional confluence. Preserving capital is the highest priority.'}
            </p>
            {signal.warnings.length > 0 && (
              <div className="pt-1 text-[10px] text-amber-400/90 font-mono space-y-0.5">
                {signal.warnings.map((w, i) => (
                  <div key={i}>⚠ {w}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Measurable Computed Reasons (Audit Trail) */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Audit Trail — Why This Decision
          </span>
          <div className="space-y-1">
            {signal.reasons.map((r, i) => (
              <div
                key={i}
                className={`flex items-start space-x-2 p-1.5 rounded text-[11px] ${
                  r.passed
                    ? 'bg-slate-900/40 text-slate-300'
                    : 'bg-slate-950 text-slate-500'
                }`}
              >
                <span className={`mt-0.5 text-xs font-bold ${r.passed ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {r.passed ? '✓' : '○'}
                </span>
                <span className="leading-tight">{r.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Version Stamp */}
        <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>Engine: {signal.strategyVersion}</span>
          <span>Source: {signal.dataSource}</span>
        </div>
      </CardContent>
    </Card>
  );
}
