'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, BookOpen, Compass, CheckCircle2, ShieldAlert, Target, Zap, Activity } from 'lucide-react';
import Link from 'next/link';

export default function StrategyDocsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold tracking-tight">Institutional SMC Strategy Specification</h1>
            <Badge variant="outline" className="text-[10px] font-mono">XAU-SMC-1.0.0</Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 overflow-y-auto text-xs leading-relaxed">
        {/* Overview */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="py-3 px-5 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
              <Compass className="w-4 h-4" />
              <span>Core Methodology: 4H Bias → 15M Execution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-slate-300">
            <p>
              The strategy operates strictly as a <strong>multi-timeframe price-action algorithm</strong> designed primarily for <strong>XAU/USD (Gold Spot)</strong>.
              It eliminates subjective guesswork by computing non-repainting mathematical pivots, supply/demand imbalances, and liquidity sweeps on closed candles only.
            </p>
            <div className="p-3 rounded bg-slate-950/70 border border-slate-800 font-mono text-[11px] text-slate-300">
              [4H Closed Bars] → Determine Directional Bias (BULLISH / BEARISH / NEUTRAL)<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              [15M Closed Bars] → Detect Active Supply/Demand Zone & Liquidity Pools<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              [Execution Trigger] → Wait for Liquidity Sweep + CHOCH + Displacement + Candle Confirmation<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              [Actionable Signal] → BUY / SELL with Exact Entry, Stop Loss, and 1:2.0+ R:R Targets
            </div>
          </CardContent>
        </Card>

        {/* Core Concepts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supply & Demand */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="py-3 px-4 border-b border-slate-800">
              <CardTitle className="text-xs font-bold uppercase text-slate-200">1. Supply & Demand Zones</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-slate-300">
              <p>
                <strong>Demand:</strong> Origin/base of an impulsive bullish departure breaking prior market structure. Formed by the final bearish candle before bullish displacement.
              </p>
              <p>
                <strong>Supply:</strong> Origin of an impulsive bearish move breaking prior lows.
              </p>
              <p className="text-[11px] text-slate-400">
                • Fresh zones (0 retests) carry maximum quality scoring.<br />
                • Zones tested &gt;3 times are marked exhausted or broken.
              </p>
            </CardContent>
          </Card>

          {/* BOS & CHOCH */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="py-3 px-4 border-b border-slate-800">
              <CardTitle className="text-xs font-bold uppercase text-slate-200">2. BOS vs CHOCH</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-slate-300">
              <p>
                <strong>BOS (Break of Structure):</strong> Continuation signal where price closes beyond a confirmed swing high in an uptrend (or swing low in a downtrend).
              </p>
              <p>
                <strong>CHOCH (Change of Character):</strong> Reversal signal where price breaches the opposite swing level, signaling a trend transition.
              </p>
            </CardContent>
          </Card>

          {/* Liquidity Sweeps */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="py-3 px-4 border-b border-slate-800">
              <CardTitle className="text-xs font-bold uppercase text-slate-200">3. Liquidity Sweeps</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-slate-300">
              <p>
                Liquidity pools rest above equal highs (Buy-side) and below equal lows (Sell-side).
              </p>
              <p>
                A valid <strong>Sweep</strong> occurs when price temporarily breaches resting stop liquidity, rejects back inside previous structure, and closes back within the key range.
              </p>
            </CardContent>
          </Card>

          {/* Displacement & Confirmation */}
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader className="py-3 px-4 border-b border-slate-800">
              <CardTitle className="text-xs font-bold uppercase text-slate-200">4. Displacement Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-slate-300">
              <p>
                Displacement confirms institutional intent:
              </p>
              <p className="text-[11px] text-slate-400">
                • Candle total range must exceed <strong>1.25× ATR</strong>.<br />
                • Candle real body must comprise at least <strong>60% of total range</strong>.<br />
                • Candlestick patterns: Engulfing or long rejection pin bars.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Execution & Risk Rules */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="py-3 px-5 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase text-slate-200 flex items-center space-x-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Risk Management & Execution Invalidation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">Entry Placement</span>
                <span className="text-[11px] text-slate-400">At close of confirmed 15M breakout or demand zone retest candle.</span>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="font-bold text-red-400 block mb-1">Stop Loss (Invalidation)</span>
                <span className="text-[11px] text-slate-400">10% ATR buffer beyond zone low or swept liquidity extreme.</span>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-1">Target Hierarchy</span>
                <span className="text-[11px] text-slate-400">TP1 = 1.5R, TP2 = 2.5R (opposing liquidity pool), TP3 = 4.0R extended.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
