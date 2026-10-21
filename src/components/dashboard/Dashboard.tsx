'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Watchlist } from './Watchlist';
import { SignalCard } from '@/components/signals/SignalCard';
import { MultiTimeframeSetups } from '@/components/signals/MultiTimeframeSetups';
import { SetupChecklist } from '@/components/signals/SetupChecklist';
import { MarketContext } from './MarketContext';
import { SignalHistory } from '@/components/signals/SignalHistory';
import { DataHealth } from './DataHealth';
import { useSignalEngine } from '@/hooks/useSignalEngine';
import { useMarketData } from '@/hooks/useMarketData';
import { useMultiTimeframeSignals } from '@/hooks/useMultiTimeframeSignals';
import { useNotifications } from '@/hooks/useNotifications';
import type { Timeframe } from '@/lib/types/market';

export function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAU/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15M');

  // Pull live multi-timeframe setups (5M, 15M, 1H, 4H)
  const {
    signals: multiSignals,
    loading: multiLoading,
    refresh: refreshMulti,
  } = useMultiTimeframeSignals(selectedSymbol);

  // Pull primary signal analysis for selected timeframe
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

  // Candlesticks for the visual zone chart
  const {
    bars,
    quote,
    loading: barsLoading,
    refresh: refreshMarketData,
  } = useMarketData(selectedSymbol, selectedTimeframe);

  // Notification audio chime & browser push manager
  const {
    permission,
    requestPermission,
    soundEnabled,
    setSoundEnabled,
    checkAndNotifySignal,
  } = useNotifications();

  // Watch for newly confirmed signals to trigger audio and notifications
  useEffect(() => {
    if (signal) {
      checkAndNotifySignal(signal, selectedTimeframe);
    }
  }, [signal, selectedTimeframe, checkAndNotifySignal]);

  const handleManualRefresh = async () => {
    await Promise.all([refreshSignal(), refreshMarketData(), refreshMulti()]);
  };

  const currentSession = signal?.currentSession || 'LONDON';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Header Toolbar with IST Clock & Audio Alert Controls */}
      <Header
        symbol={selectedSymbol}
        currentPrice={currentPrice}
        dataSource={dataSource}
        dataFresh={dataFresh}
        currentSession={currentSession}
        onRefresh={handleManualRefresh}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onRequestNotificationPermission={requestPermission}
        notificationPermission={permission}
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

        {/* Main Center Content: Scrollable Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-3 gap-3">
          {/* Section A: Multi-Timeframe Ongoing Availability (5M, 15M, 1H, 4H) */}
          <section>
            <MultiTimeframeSetups
              signals={multiSignals}
              selectedTimeframe={selectedTimeframe}
              onSelectTimeframe={(tf) => setSelectedTimeframe(tf)}
            />
          </section>

          {/* Section B: Prominent Signal Card & Zone Order Placement Visualizer */}
          <section className="w-full">
            <SignalCard
              signal={signal}
              currentPrice={currentPrice}
              bars={bars}
              timeframe={selectedTimeframe}
            />
          </section>

          {/* Section C: Lower Deck - Confluence Checklist + Macro/DXY + Signal History */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[250px]">
            {/* 1. Setup Progress Checklist */}
            <div className="h-full">
              <SetupChecklist checklist={checklist} />
            </div>

            {/* 2. Inter-market & DXY Context */}
            <div className="h-full">
              <MarketContext
                globalContext={globalContext}
                macroContext={macroContext}
                currentPrice={currentPrice}
              />
            </div>

            {/* 3. Recent Audit History */}
            <div className="h-full">
              <SignalHistory />
            </div>
          </section>
        </div>
      </div>

      {/* 3. Footer Status Line */}
      <div className="h-7 border-t border-slate-800 bg-slate-950 flex items-center px-4 justify-between shrink-0 text-xs">
        <DataHealth />
        <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
          Institutional SMC · Closed Bar Verification Only · Indian Standard Time (IST) Default
        </div>
      </div>
    </div>
  );
}
