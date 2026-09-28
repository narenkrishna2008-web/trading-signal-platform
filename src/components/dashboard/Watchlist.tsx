'use client';

import React, { useState, useEffect } from 'react';
import { StatusDot } from '@/components/ui/StatusDot';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface WatchlistProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  status: 'live' | 'stale' | 'neutral';
}

const DEFAULT_ITEMS: WatchlistItem[] = [
  { symbol: 'XAU/USD', name: 'Gold Spot', price: 2655.40, change: 12.80, changePct: 0.48, status: 'live' },
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 65420.00, change: -480.00, changePct: -0.73, status: 'live' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 2680.50, change: 35.20, changePct: 1.33, status: 'live' },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 574.80, change: 2.40, changePct: 0.42, status: 'live' },
  { symbol: 'NVDA', name: 'Nvidia Corp', price: 121.50, change: 3.10, changePct: 2.62, status: 'live' },
  { symbol: 'AAPL', name: 'Apple Inc', price: 228.40, change: -1.20, changePct: -0.52, status: 'live' },
];

export function Watchlist({ activeSymbol = 'XAU/USD', onSelectSymbol }: WatchlistProps) {
  const [items, setItems] = useState<WatchlistItem[]>(DEFAULT_ITEMS);

  // Periodically refresh watchlist prices
  useEffect(() => {
    const updatePrices = async () => {
      try {
        const promises = items.map(async item => {
          const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(item.symbol)}`);
          if (res.ok) {
            const q = await res.json();
            if (q && q.mid > 0) {
              const diff = q.mid - item.price;
              const pct = item.price > 0 ? (diff / item.price) * 100 : 0;
              return {
                ...item,
                price: Number(q.mid.toFixed(2)),
                change: Number(diff.toFixed(2)),
                changePct: Number(pct.toFixed(2)),
              };
            }
          }
          return item;
        });
        const updated = await Promise.all(promises);
        setItems(updated);
      } catch {}
    };

    updatePrices();
    const interval = setInterval(updatePrices, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="flex flex-col h-full bg-slate-950 border-r border-slate-800 w-60 shrink-0 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Market Watchlist</h2>
        <span className="text-[10px] text-slate-500 font-mono">6 Assets</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60">
        {items.map((inst) => {
          const isActive = activeSymbol === inst.symbol;
          const isUp = inst.changePct >= 0;

          return (
            <button
              key={inst.symbol}
              onClick={() => onSelectSymbol(inst.symbol)}
              className={`w-full flex items-center justify-between p-3 transition-colors text-left text-xs ${
                isActive
                  ? 'bg-slate-900/90 border-l-2 border-l-amber-500 shadow-inner'
                  : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className={`font-bold tracking-tight ${isActive ? 'text-amber-400' : 'text-slate-200'}`}>
                    {inst.symbol}
                  </span>
                  {inst.symbol === 'XAU/USD' && (
                    <span className="text-[9px] px-1 py-0.2 bg-amber-500/10 text-amber-400 rounded font-semibold border border-amber-500/20">
                      PRIMARY
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">{inst.name}</span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-slate-100 font-mono font-medium">
                  {inst.price >= 1000 ? inst.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : inst.price.toFixed(2)}
                </span>
                <div className={`flex items-center space-x-0.5 text-[10px] font-mono font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  <span>{isUp ? '+' : ''}{inst.changePct.toFixed(2)}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Primary Instrument Guarantee Note */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-900/30 text-[10px] text-slate-500 leading-tight">
        <span className="font-semibold text-slate-400">XAU/USD SMC Engine:</span> Multi-timeframe 4H Bias → 15M Execution with strict non-repainting verification.
      </div>
    </aside>
  );
}
