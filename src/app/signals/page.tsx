'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Download, Filter, Search, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

interface SignalItem {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  setupType: string;
  status: string;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  confidence: number;
  outcome?: string;
  strategyVersion: string;
  createdAt: string;
}

const DEFAULT_SIGNALS: SignalItem[] = [
  { id: 'SIG-2026-00142', symbol: 'XAU/USD', direction: 'BUY', setupType: '15M Demand Retest', status: 'BUY', entry: 2648.20, stopLoss: 2642.50, tp1: 2656.75, tp2: 2662.50, confidence: 84, outcome: 'WIN', strategyVersion: 'XAU-SMC-1.0.0', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'SIG-2026-00141', symbol: 'XAU/USD', direction: 'SELL', setupType: 'Liquidity Sweep + CHOCH', status: 'STRONG_SELL', entry: 2665.40, stopLoss: 2670.00, tp1: 2658.50, tp2: 2653.90, confidence: 88, outcome: 'WIN', strategyVersion: 'XAU-SMC-1.0.0', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 'SIG-2026-00140', symbol: 'XAU/USD', direction: 'BUY', setupType: 'Breakout Continuation', status: 'BUY', entry: 2638.10, stopLoss: 2633.00, tp1: 2645.75, tp2: 2650.80, confidence: 82, outcome: 'WIN', strategyVersion: 'XAU-SMC-1.0.0', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'SIG-2026-00139', symbol: 'XAU/USD', direction: 'SELL', setupType: 'Supply Retest', status: 'SELL', entry: 2652.80, stopLoss: 2657.00, tp1: 2646.50, tp2: 2642.30, confidence: 66, outcome: 'LOSS', strategyVersion: 'XAU-SMC-1.0.0', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'SIG-2026-00138', symbol: 'BTC/USD', direction: 'BUY', setupType: 'Demand Retest', status: 'BUY', entry: 64800.00, stopLoss: 63900.00, tp1: 66150.00, tp2: 67050.00, confidence: 80, outcome: 'WIN', strategyVersion: 'BTC-SMC-1.0.0', createdAt: new Date(Date.now() - 259200000).toISOString() },
];

export default function SignalHistoryPage() {
  const [signals, setSignals] = useState<SignalItem[]>(DEFAULT_SIGNALS);
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL');

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch('/api/signals?limit=50');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSignals(data);
          }
        }
      } catch {}
    };
    fetchSignals();
  }, []);

  const filtered = signals.filter(s => {
    if (filterDirection !== 'ALL' && s.direction !== filterDirection) return false;
    if (filterSymbol !== 'ALL' && s.symbol !== filterSymbol) return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Signal ID', 'Timestamp', 'Symbol', 'Direction', 'Setup', 'Entry', 'Stop Loss', 'TP1', 'TP2', 'Confidence', 'Outcome', 'Strategy'];
    const rows = filtered.map(s => [
      s.id,
      s.createdAt,
      s.symbol,
      s.direction,
      `"${s.setupType}"`,
      s.entry,
      s.stopLoss,
      s.tp1,
      s.tp2,
      s.confidence,
      s.outcome || 'ACTIVE',
      s.strategyVersion,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `SignalHistory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold tracking-tight">Signal History & Audit Trail</h1>
            <Badge variant="outline" className="text-[10px] font-mono">NON-REPAINTING LOG</Badge>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 overflow-y-auto">
        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filters</span>
            </span>

            {/* Direction Filter */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
              {(['ALL', 'BUY', 'SELL'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setFilterDirection(d)}
                  className={`px-2.5 py-1 rounded font-semibold text-xs ${
                    filterDirection === d
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Symbol Filter */}
            <select
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Symbols</option>
              <option value="XAU/USD">XAU/USD</option>
              <option value="BTC/USD">BTC/USD</option>
              <option value="ETH/USD">ETH/USD</option>
            </select>
          </div>

          <span className="text-slate-500 font-mono">
            Showing {filtered.length} of {signals.length} signals
          </span>
        </div>

        {/* Signals Table */}
        <Card className="bg-slate-900/90 border-slate-800 overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Signal ID</th>
                  <th className="py-3 px-3">Date / Time (UTC)</th>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Direction</th>
                  <th className="py-3 px-3">Setup Type</th>
                  <th className="py-3 px-3">Entry</th>
                  <th className="py-3 px-3">Stop Loss</th>
                  <th className="py-3 px-3">Targets (TP1 / TP2)</th>
                  <th className="py-3 px-3">Confluence</th>
                  <th className="py-3 px-3">Outcome</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filtered.map((s) => {
                  const isBuy = s.direction === 'BUY';
                  const isWin = s.outcome === 'WIN';
                  const isLoss = s.outcome === 'LOSS';

                  return (
                    <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-300">{s.id}</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {new Date(s.createdAt).toISOString().slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-200">{s.symbol}</td>
                      <td className="py-3 px-3">
                        <Badge variant={isBuy ? 'bullish' : 'bearish'} className="text-[10px] font-bold px-1.5 py-0">
                          {s.direction}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300 text-[11px]">{s.setupType}</td>
                      <td className="py-3 px-3 text-slate-100 font-bold">${s.entry.toFixed(2)}</td>
                      <td className="py-3 px-3 text-red-400">${s.stopLoss.toFixed(2)}</td>
                      <td className="py-3 px-3 text-emerald-400 text-[11px]">
                        ${s.tp1.toFixed(2)} / ${s.tp2.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-bold ${s.confidence >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {s.confidence}/100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isWin ? 'bg-emerald-500/10 text-emerald-400' :
                          isLoss ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {s.outcome || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/signals/${encodeURIComponent(s.id)}`}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-sans font-semibold text-[11px] transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
