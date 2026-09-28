'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Globe, DollarSign, Calendar, Flame } from 'lucide-react';
import type { GlobalContextState } from '@/lib/engine/global-context';
import type { MacroCalendarState } from '@/lib/engine/macro-calendar';

interface MarketContextProps {
  globalContext?: GlobalContextState | null;
  macroContext?: MacroCalendarState | null;
  currentPrice?: number;
}

export function MarketContext({ globalContext, macroContext, currentPrice }: MarketContextProps) {
  const dxy = globalContext?.dxy;
  const us10y = globalContext?.us10y;
  const macroSentiment = globalContext?.macroSentimentScore ?? 0;
  const nextEvent = macroContext?.events?.[0];

  return (
    <Card className="h-full flex flex-col bg-slate-900/90 border-slate-800">
      <CardHeader className="py-2.5 px-4 border-b border-slate-800/80 flex flex-row items-center justify-between shrink-0">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>Macro & Inter-Market Context</span>
        </CardTitle>
        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
          macroSentiment > 20 ? 'text-emerald-400 bg-emerald-500/10' :
          macroSentiment < -20 ? 'text-red-400 bg-red-500/10' :
          'text-slate-400 bg-slate-800'
        }`}>
          GOLD {macroSentiment > 20 ? 'TAILWINDS' : macroSentiment < -20 ? 'HEADWINDS' : 'BALANCED'}
        </span>
      </CardHeader>

      <CardContent className="p-3 flex-1 overflow-y-auto space-y-2.5 text-xs">
        {/* DXY & 10Y Yields Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-semibold flex items-center space-x-1">
                <DollarSign className="w-3 h-3 text-amber-400" />
                <span>US Dollar (DXY)</span>
              </span>
              <span className={`font-mono font-bold ${
                (dxy?.changePct ?? 0) <= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {dxy ? `${dxy.changePct >= 0 ? '+' : ''}${dxy.changePct.toFixed(2)}%` : '-0.25%'}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
              {dxy?.price ? dxy.price.toFixed(2) : '100.85'}
            </div>
            <div className="text-[10px] text-slate-500">
              {(dxy?.changePct ?? 0) <= 0 ? 'Weak Dollar (Bullish Gold)' : 'Strong Dollar (Bearish Gold)'}
            </div>
          </div>

          <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span className="font-semibold flex items-center space-x-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>US 10-Yr Yield</span>
              </span>
              <span className={`font-mono font-bold ${
                (us10y?.changePct ?? 0) <= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {us10y ? `${us10y.changePct >= 0 ? '+' : ''}${us10y.changePct.toFixed(2)}%` : '-1.32%'}
              </span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-100 mt-0.5">
              {us10y?.price ? `${us10y.price.toFixed(2)}%` : '3.74%'}
            </div>
            <div className="text-[10px] text-slate-500">
              {(us10y?.changePct ?? 0) <= 0 ? 'Yields Dropping (Bullish)' : 'Yields Rising (Bearish)'}
            </div>
          </div>
        </div>

        {/* Macro Calendar Alert */}
        <div className={`p-2.5 rounded border ${
          macroContext?.isBlackoutActive
            ? 'bg-red-950/20 border-red-900/50'
            : 'bg-slate-950/40 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>Next High-Impact Event</span>
            </span>
            {nextEvent && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                {nextEvent.countdownBadge}
              </span>
            )}
          </div>

          {nextEvent ? (
            <div className="space-y-1">
              <div className="font-semibold text-slate-200 text-[11px] leading-tight">
                {nextEvent.title}
              </div>
              <div className="text-[10px] text-slate-400 leading-snug">
                {nextEvent.goldImplication}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">
              No high-impact macro risk events within next 24 hours. Clear runway for technical setups.
            </div>
          )}
        </div>

        {/* Tactical Playbook Note */}
        <div className="p-2 rounded bg-slate-950/30 border border-slate-800/60 text-[10px] text-slate-400 leading-tight">
          <span className="font-semibold text-slate-300">Macro Playbook: </span>
          {globalContext?.tacticalNote || 'DXY and yields are balanced. Strict focus on 15M SMC structure and confirmation.'}
        </div>
      </CardContent>
    </Card>
  );
}
