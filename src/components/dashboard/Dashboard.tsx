'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Watchlist } from './Watchlist';
import { TradingChart } from '@/components/chart/TradingChart';
import { SignalCard } from '@/components/signals/SignalCard';
import { SetupChecklist } from '@/components/signals/SetupChecklist';
import { MarketContext } from './MarketContext';
import { SignalHistory } from '@/components/signals/SignalHistory';
import { DataHealth } from './DataHealth';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { useMarketData } from '@/hooks/useMarketData';
import type { Timeframe } from '@/lib/types/market';

export function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAU/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15M');

  // Pull live signal analysis
  const {
    signal,
    checklist,
    bias,
    globalContext,
    macroContext,
    currentPrice,
    dataSource,
    dataFresh,
    loading: signalLoading,
    refresh: refreshSignal,
  } = useSignalEngine(selectedSymbol, selectedTimeframe);

  // Pull live market candlestick data for chart
  const {
    bars,
    quote,
    loading: barsLoading,
    refresh: refreshMarketData,
  } = useMarketData(selectedSymbol, selectedTimeframe);

  const handleManualRefresh = async () => {
    await Promise.all([refreshSignal(), refreshMarketData()]);
  };

  const currentSession = signal?.currentSession || 'LONDON';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Header Toolbar */}
      <Header
        symbol={selectedSymbol}
        currentPrice={currentPrice}
        dataSource={dataSource}
        dataFresh={dataFresh}
        currentSession={currentSession}
        onRefresh={handleManualRefresh}
      />

      {/* 2. Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Watchlist Sidebar */}
        <div className="hidden md:block shrink-0">
          <Watchlist
            activeSymbol={selectedSymbol}
            onSelectSymbol={(sym) => setSelectedSymbol(sym)}
          />
        </div>

        {/* Center Main Stage + Right Signal Card */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Upper Deck: Chart (Center) + Signal Intelligence Card (Right) */}
          <div className="flex-1 flex flex-col lg:flex-row p-3 gap-3 min-h-0 overflow-hidden">
            {/* Chart Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-[360px] h-full overflow-hidden">
              <TradingChart
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
                bars={bars}
                signal={signal}
                onTimeframeChange={(tf) => setSelectedTimeframe(tf)}
              />
            </div>

            {/* Prominent Right Panel: Signal Decision Card */}
            <div className="w-full lg:w-[350px] shrink-0 h-auto lg:h-full overflow-y-auto">
              <SignalCard
                signal={signal}
                currentPrice={currentPrice}
              />
            </div>
          </div>

          {/* Lower Deck: Setup Checklist + Macro/DXY Context + Signal History */}
          <div className="h-64 shrink-0 px-3 pb-2 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden">
            {/* 1. Setup Progress Checklist */}
            <div className="h-full overflow-hidden">
              <SetupChecklist checklist={checklist} />
            </div>

            {/* 2. Inter-market & DXY Context */}
            <div className="h-full overflow-hidden">
              <MarketContext
                globalContext={globalContext}
                macroContext={macroContext}
                currentPrice={currentPrice}
              />
            </div>

            {/* 3. Recent Audit History */}
            <div className="h-full overflow-hidden">
              <SignalHistory />
            </div>
          </div>

          {/* 3. Footer Status Line */}
          <div className="h-7 border-t border-slate-800 bg-slate-950 flex items-center px-4 justify-between shrink-0 text-xs">
            <DataHealth />
            <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
              Institutional SMC · Closed Bar Verification · Non-Repainting
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
