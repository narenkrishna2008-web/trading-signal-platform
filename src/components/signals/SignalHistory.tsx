'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ExternalLink, History } from 'lucide-react';
import Link from 'next/link';

interface SignalHistoryItem {
  id: string;
  timestamp: string;
  direction: 'BUY' | 'SELL';
  setupType: string;
  entry: number;
  stopLoss: number;
  tp2: number;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'ACTIVE';
  rMultiple: string;
  confidence: number;
}

const DEFAULT_SIGNALS: SignalHistoryItem[] = [
  { id: 'SIG-2026-00142', timestamp: 'Today 14:15 UTC', direction: 'BUY', setupType: '15M Demand Retest', entry: 2648.20, stopLoss: 2642.50, tp2: 2662.50, outcome: 'WIN', rMultiple: '+2.5R', confidence: 84 },
  { id: 'SIG-2026-00141', timestamp: 'Today 09:30 UTC', direction: 'SELL', setupType: 'Liquidity Sweep + CHOCH', entry: 2665.40, stopLoss: 2670.00, tp2: 2653.90, outcome: 'WIN', rMultiple: '+2.5R', confidence: 78 },
  { id: 'SIG-2026-00140', timestamp: 'Yesterday 16:45 UTC', direction: 'BUY', setupType: 'Breakout Continuation', entry: 2638.10, stopLoss: 2633.00, tp2: 2650.80, outcome: 'WIN', rMultiple: '+2.5R', confidence: 82 },
  { id: 'SIG-2026-00139', timestamp: 'Yesterday 11:15 UTC', direction: 'SELL', setupType: 'Supply Retest', entry: 2652.80, stopLoss: 2657.00, tp2: 2642.30, outcome: 'LOSS', rMultiple: '-1.0R', confidence: 66 },
];

export function SignalHistory() {
  const [signals, setSignals] = useState<SignalHistoryItem[]>(DEFAULT_SIGNALS);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch('/api/signals?limit=4');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: SignalHistoryItem[] = data.map((s: any) => ({
              id: s.id,
              timestamp: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              direction: (s.direction as 'BUY' | 'SELL') || 'BUY',
              setupType: s.setupType ? s.setupType.replace(/_/g, ' ') : 'SMC Setup',
              entry: s.entry || 2650,
              stopLoss: s.stopLoss || 2640,
              tp2: s.tp2 || 2675,
              outcome: (s.outcome as any) || 'ACTIVE',
              rMultiple: s.outcome === 'WIN' ? '+2.5R' : s.outcome === 'LOSS' ? '-1.0R' : 'Active',
              confidence: s.confidence || 75,
            }));
            setSignals(mapped);
          }
        }
      } catch {}
    };
    fetchSignals();
  }, []);

  return (
    <Card className="h-full flex flex-col bg-slate-900/90 border-slate-800">
      <CardHeader className="py-2.5 px-4 border-b border-slate-800/80 flex flex-row items-center justify-between shrink-0">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>Recent Signal Execution</span>
        </CardTitle>
        <Link
          href="/signals"
          className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-0.5"
        >
          <span>Full History</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto divide-y divide-slate-800/60 text-xs">
        {signals.map((item) => {
          const isBuy = item.direction === 'BUY';
          const isWin = item.outcome === 'WIN';
          const isLoss = item.outcome === 'LOSS';

          return (
            <Link
              key={item.id}
              href={`/signals/${encodeURIComponent(item.id)}`}
              className="p-2.5 flex items-center justify-between hover:bg-slate-850/50 transition-colors block"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Badge variant={isBuy ? 'bullish' : 'bearish'} className="text-[10px] px-1.5 py-0 font-bold shrink-0">
                  {item.direction}
                </Badge>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-slate-200 truncate">
                    {item.setupType}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.timestamp} · Entry ${item.entry.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] font-mono text-slate-500">
                  {item.confidence}/100
                </span>
                <span className={`font-mono font-bold text-xs ${
                  isWin ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {item.rMultiple}
                </span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
