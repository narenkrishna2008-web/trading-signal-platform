'use client';

import React, { useState, useEffect } from 'react';
import { StatusDot } from '@/components/ui/StatusDot';
import { Settings, BarChart2, BookOpen, History, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  symbol?: string;
  currentPrice?: number;
  dataSource?: string;
  dataFresh?: boolean;
  currentSession?: string;
  onRefresh?: () => void;
}

export function Header({
  symbol = 'XAU/USD',
  currentPrice,
  dataSource = 'LIVE',
  dataFresh = true,
  currentSession = 'London',
  onRefresh,
}: HeaderProps) {
  const [utcTime, setUtcTime] = useState<string>('');
  const [istTime, setIstTime] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
      // Asia/Kolkata timezone default (IST)
      try {
        const istStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
        setIstTime(istStr + ' IST');
      } catch {
        setIstTime('');
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshClick = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const isDemo = dataSource.toLowerCase().includes('demo') || dataSource.toLowerCase().includes('simulat');

  return (
    <header className="flex flex-wrap h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-xs shrink-0 select-none z-10">
      {/* Brand & Market Status */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2 font-bold text-slate-100 hover:text-amber-400 transition-colors">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-sm">
            Σ
          </div>
          <span className="text-base tracking-tight font-extrabold">SIGNAL EDGE</span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
            XAU/USD SMC
          </span>
        </Link>

        {/* Live / Stale / Demo Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <StatusDot status={!dataFresh ? 'stale' : isDemo ? 'demo' : 'live'} pulse={dataFresh} />
          <div className="flex flex-col">
            <span className="text-slate-200 font-semibold text-xs tracking-wide">
              {symbol} {currentPrice ? `· $${currentPrice.toFixed(2)}` : ''}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {dataFresh ? (isDemo ? 'SIMULATED DEMO FEED' : `LIVE · ${dataSource}`) : 'DATA STALE (SIGNALS PAUSED)'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation & Context */}
      <div className="flex items-center space-x-4">
        {/* Market Session Indicator */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
          <span className="text-slate-500">Session:</span>
          <span className="text-emerald-400 font-medium tracking-wide">
            {currentSession.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Clocks */}
        <div className="hidden md:flex flex-col items-end text-[11px] font-mono leading-tight">
          <span className="text-slate-300 font-semibold">{utcTime}</span>
          <span className="text-slate-500">{istTime}</span>
        </div>

        {/* Manual Refresh */}
        {onRefresh && (
          <button
            onClick={handleRefreshClick}
            title="Refresh Market Evaluation"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        )}

        {/* Navigation Links */}
        <nav className="flex items-center space-x-1 border-l border-slate-800 pl-3">
          <Link
            href="/signals"
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            title="Signal History & Audit Trail"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Signals</span>
          </Link>

          <Link
            href="/backtest"
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            title="SMC Backtesting Engine"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Backtest</span>
          </Link>

          <Link
            href="/journal"
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            title="Trader Journal"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Journal</span>
          </Link>

          <Link
            href="/settings"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-100 transition-colors"
            title="Platform Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
