'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, BookOpen, Plus, Sparkles, Smile, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface JournalEntry {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  setupType: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
  pnl?: number;
  notes: string;
  emotionalState: string;
  ruleFollowingScore: number;
  mistakeCategory?: string;
  linkedSignalId?: string;
  createdAt: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [symbol, setSymbol] = useState('XAU/USD');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [setupType, setSetupType] = useState('15M Demand Retest + BOS');
  const [entryPrice, setEntryPrice] = useState(2650.0);
  const [stopLoss, setStopLoss] = useState(2644.0);
  const [takeProfit, setTakeProfit] = useState(2665.0);
  const [result, setResult] = useState<'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN'>('WIN');
  const [pnl, setPnl] = useState(250);
  const [notes, setNotes] = useState('Clean 15M demand zone bounce after sell-side liquidity sweep. Waited for 15M engulfing confirmation.');
  const [emotionalState, setEmotionalState] = useState('Disciplined / Calm');
  const [ruleFollowingScore, setRuleFollowingScore] = useState(9);
  const [mistakeCategory, setMistakeCategory] = useState('None (Followed Plan)');
  const [linkedSignalId, setLinkedSignalId] = useState('SIG-2026-00142');

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/journal');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.warn('Journal fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          direction,
          setupType,
          entryPrice: Number(entryPrice),
          stopLoss: Number(stopLoss),
          takeProfit: Number(takeProfit),
          result,
          pnl: Number(pnl),
          notes,
          emotionalState,
          ruleFollowingScore: Number(ruleFollowingScore),
          mistakeCategory,
          linkedSignalId: linkedSignalId || undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchEntries();
      }
    } catch (err) {
      console.error('Error saving journal entry:', err);
    }
  };

  const totalTrades = entries.length;
  const wins = entries.filter(e => e.result === 'WIN').length;
  const avgRuleScore = totalTrades > 0
    ? (entries.reduce((acc, e) => acc + (e.ruleFollowingScore || 0), 0) / totalTrades).toFixed(1)
    : '0.0';

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold tracking-tight">Trader Execution Journal</h1>
            <Badge variant="outline" className="text-[10px] font-mono">PSYCHOLOGY & RULES</Badge>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Journal Entry</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 overflow-y-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Total Recorded Trades</span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalTrades}</div>
            </div>
            <BookOpen className="w-8 h-8 text-slate-700" />
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Journal Win Rate</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {totalTrades > 0 ? `${Math.round((wins / totalTrades) * 100)}%` : '0%'}
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-900/50" />
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Rule Discipline Score</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {avgRuleScore} <span className="text-xs text-slate-500 font-sans">/ 10</span>
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-amber-900/50" />
          </div>
        </div>

        {/* Entries List */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="py-3 px-5 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Journal Entries ({entries.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-slate-800/80">
            {entries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No trade entries logged yet. Click &quot;New Journal Entry&quot; above to log your first trade with notes and discipline score.
              </div>
            ) : (
              entries.map((entry) => {
                const isBuy = entry.direction === 'BUY';
                const isWin = entry.result === 'WIN';

                return (
                  <div key={entry.id} className="p-4 hover:bg-slate-850/40 transition-colors space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <Badge variant={isBuy ? 'bullish' : 'bearish'} className="text-xs font-bold">
                          {entry.direction}
                        </Badge>
                        <span className="font-bold text-sm text-slate-100">{entry.symbol}</span>
                        <span className="text-xs text-slate-400">· {entry.setupType}</span>
                        {entry.linkedSignalId && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700 font-mono">
                            Linked: {entry.linkedSignalId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs">
                        <span className={`font-mono font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
                          {entry.pnl !== undefined ? `${entry.pnl >= 0 ? '+' : ''}$${entry.pnl}` : ''} ({entry.result})
                        </span>
                        <span className="text-slate-500 font-mono">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Trade Levels */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/60">
                      <span>Entry: <strong className="text-slate-200">${entry.entryPrice}</strong></span>
                      <span>Stop: <strong className="text-red-400">${entry.stopLoss}</strong></span>
                      <span>Target: <strong className="text-emerald-400">${entry.takeProfit}</strong></span>
                      <span>Discipline: <strong className="text-amber-400">{entry.ruleFollowingScore}/10</strong></span>
                      <span>Mindset: <strong className="text-slate-300 font-sans">{entry.emotionalState}</strong></span>
                    </div>

                    {/* Notes */}
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      {entry.notes}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Journal Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Log Trade Execution</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Setup Type</label>
                <input
                  type="text"
                  value={setupType}
                  onChange={(e) => setSetupType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Stop Loss</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Take Profit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Outcome</label>
                  <select
                    value={result}
                    onChange={(e) => setResult(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  >
                    <option value="WIN">WIN</option>
                    <option value="LOSS">LOSS</option>
                    <option value="BREAKEVEN">BREAKEVEN</option>
                    <option value="OPEN">OPEN</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Realized P&L ($)</label>
                  <input
                    type="number"
                    value={pnl}
                    onChange={(e) => setPnl(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Discipline Score (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={ruleFollowingScore}
                    onChange={(e) => setRuleFollowingScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Mindset State</label>
                  <select
                    value={emotionalState}
                    onChange={(e) => setEmotionalState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  >
                    <option value="Disciplined / Calm">Disciplined / Calm</option>
                    <option value="FOMO (Fear of Missing Out)">FOMO</option>
                    <option value="Hesitant / Late Entry">Hesitant / Late Entry</option>
                    <option value="Greedy / Held Past Target">Greedy</option>
                    <option value="Revenge Trading">Revenge Trading</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Link to Signal ID (Optional)</label>
                <input
                  type="text"
                  value={linkedSignalId}
                  onChange={(e) => setLinkedSignalId(e.target.value)}
                  placeholder="e.g. SIG-2026-00142"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Trade Notes & Rationale</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 leading-relaxed"
                  placeholder="Why did you take this setup? Did 15M confirmation occur?"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
