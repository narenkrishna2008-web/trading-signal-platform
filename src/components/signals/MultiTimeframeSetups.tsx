'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, Layers, ShieldCheck, TrendingUp } from 'lucide-react';
import type { Timeframe } from '@/lib/types/market';
import type { TimeframeSignalData } from '@/hooks/useMultiTimeframeSignals';

interface MultiTimeframeSetupsProps {
  signals: Partial<Record<Timeframe, TimeframeSignalData>>;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
}

export function MultiTimeframeSetups({
  signals,
  selectedTimeframe,
  onSelectTimeframe,
}: MultiTimeframeSetupsProps) {
  const timeframes: Timeframe[] = ['5M', '15M', '1H', '4H'];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Multi-Timeframe Ongoing Availability (5M · 15M · 1H · 4H)
          </h2>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            · Live Closed-Candle Confirmation Required
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Click any card to inspect
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {timeframes.map((tf) => {
          const item = signals[tf];
          const signal = item?.signal;
          const isSelected = selectedTimeframe === tf;

          const isBuy = signal?.status.includes('BUY');
          const isSell = signal?.status.includes('SELL');
          const isWait = signal?.status === 'WAIT';
          const isConfirmed = (isBuy || isSell) && (signal?.lifecycle === 'CONFIRMED' || signal?.lifecycle === 'ACTIVE');

          // Win probability derived from strategy confidence score
          const winProb = signal?.confidence || 0;
          const zone = signal?.activeZone || item?.activeZone;

          let cardBorder = isSelected
            ? 'border-amber-500/80 ring-1 ring-amber-500/50 bg-slate-900/90'
            : 'border-slate-800/80 bg-slate-950/90 hover:border-slate-700';

          if (isConfirmed && isBuy) {
            cardBorder = isSelected
              ? 'border-emerald-500 ring-1 ring-emerald-500/60 bg-slate-900'
              : 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500/60';
          } else if (isConfirmed && isSell) {
            cardBorder = isSelected
              ? 'border-red-500 ring-1 ring-red-500/60 bg-slate-900'
              : 'border-red-500/40 bg-red-950/10 hover:border-red-500/60';
          }

          return (
            <button
              key={tf}
              onClick={() => onSelectTimeframe(tf)}
              className={`p-3 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between relative group ${cardBorder}`}
            >
              {/* Card Header: Timeframe + Active Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-xs font-mono text-slate-100 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {tf}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {tf === '4H' ? 'HTF BIAS' : tf === '1H' ? 'INTERMEDIATE' : tf === '15M' ? 'PRIMARY EXEC' : 'SCALP EXEC'}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                      Selected
                    </span>
                  )}
                </div>

                {/* Signal Status Line */}
                <div className="my-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {isConfirmed && isBuy && (
                      <div className="flex items-center text-emerald-400 font-black text-sm">
                        <span>CONFIRMED BUY</span>
                        <ArrowUpRight className="w-4 h-4 ml-0.5 stroke-[3]" />
                      </div>
                    )}
                    {isConfirmed && isSell && (
                      <div className="flex items-center text-red-400 font-black text-sm">
                        <span>CONFIRMED SELL</span>
                        <ArrowDownRight className="w-4 h-4 ml-0.5 stroke-[3]" />
                      </div>
                    )}
                    {isWait && (
                      <div className="flex items-center text-amber-400 font-bold text-xs space-x-1">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>DEVELOPING SETUP</span>
                      </div>
                    )}
                    {!isConfirmed && !isWait && (
                      <div className="text-slate-400 font-semibold text-xs">
                        NO ACTIVE SETUP
                      </div>
                    )}
                  </div>

                  {/* Candle Confirmation Badge */}
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isConfirmed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isWait
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isConfirmed ? '✓ CLOSED CANDLE' : isWait ? '⏳ PENDING CANDLE' : 'IDLE'}
                  </span>
                </div>

                {/* Win Probability & Confluence Meter */}
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 my-2 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-semibold flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-slate-400" />
                      <span>Win Probability:</span>
                    </span>
                    <span className={`font-mono font-bold text-xs ${
                      winProb >= 75 ? 'text-emerald-400' :
                      winProb >= 55 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {winProb}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        winProb >= 75 ? 'bg-emerald-400' :
                        winProb >= 55 ? 'bg-amber-400' : 'bg-slate-600'
                      }`}
                      style={{ width: `${Math.max(5, winProb)}%` }}
                    />
                  </div>
                </div>

                {/* Supply/Demand Zone Details */}
                <div className="text-[10px] space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Zone Location:</span>
                    {zone ? (
                      <span className={`font-mono font-bold ${
                        zone.type === 'DEMAND' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {zone.type} (${zone.low.toFixed(1)} – ${zone.high.toFixed(1)})
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">No Active Zone</span>
                    )}
                  </div>

                  {/* Planned Execution Prices */}
                  {signal?.entry && signal?.stopLoss ? (
                    <div className="flex justify-between items-center font-mono text-[10px]">
                      <span className="text-slate-500">Entry: ${signal.entry.toFixed(1)}</span>
                      <span className="text-slate-500">SL: ${signal.stopLoss.toFixed(1)}</span>
                      <span className="text-emerald-400 font-bold">
                        R:R 1:{signal.riskReward ? signal.riskReward.toFixed(1) : '2.0+'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic">
                      {isWait ? 'Waiting for candle close to confirm order' : 'Scanning structure & liquidity'}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer instruction */}
              <div className="mt-2 text-[9px] text-slate-500 group-hover:text-amber-400/80 transition-colors flex items-center justify-between border-t border-slate-900 pt-1.5 font-mono">
                <span>Timeframe: {tf}</span>
                <span>Select &rarr;</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
