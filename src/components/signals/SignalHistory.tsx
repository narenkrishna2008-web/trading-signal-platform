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
  { id: 'SIG-2026-00188', timestamp: 'Today 8:30 PM IST', direction: 'SELL', setupType: '15M Supply Retest + CHOCH', entry: 4068.50, stopLoss: 4078.20, tp2: 4044.25, outcome: 'WIN', rMultiple: '+2.5R', confidence: 82 },
  { id: 'SIG-2026-00187', timestamp: 'Today 6:45 PM IST', direction: 'SELL', setupType: '5M Liquidity Sweep + Displacement', entry: 4074.20, stopLoss: 4080.50, tp2: 4058.45, outcome: 'WIN', rMultiple: '+2.5R', confidence: 79 },
  { id: 'SIG-2026-00186', timestamp: 'Today 3:15 PM IST', direction: 'BUY', setupType: '1H Demand Zone Bounce', entry: 4048.80, stopLoss: 4038.50, tp2: 4074.55, outcome: 'WIN', rMultiple: '+2.5R', confidence: 76 },
  { id: 'SIG-2026-00185', timestamp: 'Today 11:30 AM IST', direction: 'SELL', setupType: '15M Breakdown Continuation', entry: 4082.40, stopLoss: 4089.00, tp2: 4065.90, outcome: 'LOSS', rMultiple: '-1.0R', confidence: 71 },
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
              timestamp: new Date(s.createdAt || Date.now()).toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              }) + ' IST',
              direction: (s.direction as 'BUY' | 'SELL') || 'BUY',
              setupType: s.setupType ? s.setupType.replace(/_/g, ' ') : `${s.timeframe || '15M'} SMC Setup`,
              entry: s.entry || 4062.5,
              stopLoss: s.stopLoss || 4050.0,
              tp2: s.tp2 || 4085.0,
              outcome: (s.outcome as any) || 'ACTIVE',
              rMultiple: s.rMultiple || (s.outcome === 'WIN' ? '+2.5R' : s.outcome === 'LOSS' ? '-1.0R' : 'Active'),
              confidence: s.confidence || 75,
            }));
            setSignals(mapped);
          }
        }
      } catch {}
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full flex flex-col bg-slate-900/90 border-slate-800">
      <CardHeader className="py-2.5 px-4 border-b border-slate-800/80 flex flex-row items-center justify-between shrink-0">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>Today's Signal Executions (IST)</span>
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
                  {item.confidence}%
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
