'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Sliders, Shield, Database, Bell, Check, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [provider, setProvider] = useState('YahooFinance (Live Spot/Futures)');
  const [htf, setHtf] = useState('4H');
  const [ltf, setLtf] = useState('15M');
  const [leftBars, setLeftBars] = useState(2);
  const [rightBars, setRightBars] = useState(2);
  const [atrMultiple, setAtrMultiple] = useState(1.25);
  const [minBodyRatio, setMinBodyRatio] = useState(0.60);
  const [minRR, setMinRR] = useState(2.0);
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [maxDailyLoss, setMaxDailyLoss] = useState(3.0);
  const [paperMode, setPaperMode] = useState(true);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [sessionFilter, setSessionFilter] = useState(true);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.strategy) {
            setHtf(data.strategy.higherTimeframe || '4H');
            setLtf(data.strategy.executionTimeframe || '15M');
          }
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          htf,
          ltf,
          swingDetection: { leftBars, rightBars },
          displacement: { atrMultiple, minBodyRatio },
          risk: { minRR, accountSize, riskPercent, maxDailyLoss, paperMode },
          timezone,
          sessionFilter,
        }),
      });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch {}
  };

  const handleReset = () => {
    setProvider('YahooFinance (Live Spot/Futures)');
    setHtf('4H');
    setLtf('15M');
    setLeftBars(2);
    setRightBars(2);
    setAtrMultiple(1.25);
    setMinBodyRatio(0.60);
    setMinRR(2.0);
    setAccountSize(10000);
    setRiskPercent(1.0);
    setMaxDailyLoss(3.0);
    setPaperMode(true);
    setTimezone('Asia/Kolkata');
    setSessionFilter(true);
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
            <Sliders className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold tracking-tight">Strategy & Risk Configuration</h1>
            <Badge variant="outline" className="text-[10px] font-mono">XAU-SMC-1.0.0</Badge>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{savedFeedback ? 'Saved!' : 'Save Preferences'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 overflow-y-auto">
        {/* 1. Market Data Feed */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="py-3 px-5 border-b border-slate-800 flex items-center space-x-2">
            <Database className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Market Data & Provider Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Primary Feed Source</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
              >
                <option value="YahooFinance (Live Spot/Futures)">YahooFinance (Live Spot GC=F / Futures)</option>
                <option value="DemoProvider (High-Fidelity Simulation)">DemoProvider (High-Fidelity Simulation)</option>
                <option value="TwelveData (Configured in .env)">TwelveData API (Configured in .env)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Display Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30) — Default</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (EST/EDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 2. SMC Strategy Parameters */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="py-3 px-5 border-b border-slate-800 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
              SMC Multi-Timeframe Strategy Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">HTF (Bias)</label>
                <select
                  value={htf}
                  onChange={(e) => setHtf(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                >
                  <option value="4H">4H (Recommended)</option>
                  <option value="1D">1D</option>
                  <option value="1H">1H</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">LTF (Execution)</label>
                <select
                  value={ltf}
                  onChange={(e) => setLtf(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                >
                  <option value="15M">15M (Recommended)</option>
                  <option value="5M">5M</option>
                  <option value="30M">30M</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Swing Left Bars</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={leftBars}
                  onChange={(e) => setLeftBars(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Swing Right Bars</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rightBars}
                  onChange={(e) => setRightBars(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Displacement ATR Multiple</label>
                <input
                  type="number"
                  step="0.05"
                  value={atrMultiple}
                  onChange={(e) => setAtrMultiple(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                />
                <span className="text-[10px] text-slate-500">Minimum candle range multiple of ATR</span>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Min Candle Body Ratio</label>
                <input
                  type="number"
                  step="0.05"
                  value={minBodyRatio}
                  onChange={(e) => setMinBodyRatio(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                />
                <span className="text-[10px] text-slate-500">e.g. 0.60 = 60% of candle must be body</span>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Minimum Risk / Reward</label>
                <input
                  type="number"
                  step="0.1"
                  value={minRR}
                  onChange={(e) => setMinRR(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                />
                <span className="text-[10px] text-slate-500">Minimum R:R threshold for valid signal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Risk & Safeguards */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="py-3 px-5 border-b border-slate-800 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Risk Management & Capital Safeguards
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Account Equity ($)</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold block mb-1">Max Daily Drawdown (%)</label>
              <input
                type="number"
                step="0.5"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
