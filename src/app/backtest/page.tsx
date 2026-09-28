'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Play, Download, ArrowLeft, BarChart3, TrendingUp, AlertCircle, CheckCircle, Percent } from 'lucide-react';
import Link from 'next/link';
import type { BacktestResult, BacktestTrade } from '@/lib/types/strategy';

export default function BacktestPage() {
  const [symbol, setSymbol] = useState('XAU/USD');
  const [startingBalance, setStartingBalance] = useState(10000);
  const [riskPerTrade, setRiskPerTrade] = useState(1.0);
  const [spread, setSpread] = useState(0.20);
  const [slippage, setSlippage] = useState(0.05);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          startingBalance,
          riskPerTrade,
          spread,
          slippage,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data: BacktestResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!result || result.trades.length === 0) return;

    const headers = ['Trade #', 'Direction', 'Setup', 'Entry Price', 'Exit Price', 'Outcome', 'PnL ($)', 'R-Multiple', 'Holding Bars', 'MFE', 'MAE', 'Exit Reason'];
    const rows = result.trades.map((t, i) => [
      i + 1,
      t.direction,
      t.setupType,
      t.entryPrice,
      t.exitPrice,
      t.result,
      t.pnl,
      t.rMultiple,
      t.holdingBars,
      t.maxFavorableExcursion,
      t.maxAdverseExcursion,
      `"${t.exitReason}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Backtest_${symbol}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold tracking-tight">Institutional SMC Backtester</h1>
            <Badge variant="outline" className="text-[10px] font-mono">NON-REPAINTING REPLAY</Badge>
          </div>
        </div>

        {result && (
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6 overflow-y-auto">
        {/* Parameters Form Card */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="py-3 px-5 border-b border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Backtest Configuration Parameters
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Trading Instrument</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                >
                  <option value="XAU/USD">XAU/USD (Gold Spot)</option>
                  <option value="BTC/USD">BTC/USD (Bitcoin)</option>
                  <option value="ETH/USD">ETH/USD (Ethereum)</option>
                  <option value="SPY">SPY (S&P 500 ETF)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Starting Balance ($)</label>
                <input
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Risk Per Trade (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Simulated Spread ($)</label>
                <input
                  type="number"
                  step="0.05"
                  value={spread}
                  onChange={(e) => setSpread(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Slippage Buffer ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={slippage}
                  onChange={(e) => setSlippage(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400">
                Replay method: <span className="text-amber-400 font-semibold font-mono">15M Closed Bar Step-by-Step</span> with 4H Directional Bias & conservative same-bar tie-breaking.
              </div>

              <button
                onClick={handleRunBacktest}
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{loading ? 'Replaying Historical Bars...' : 'Run Chronological Backtest'}</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 rounded bg-red-950/30 border border-red-800 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Deck */}
        {result && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Trades</span>
                <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                  {result.metrics.totalTrades}
                </div>
                <div className="text-[10px] text-slate-500">
                  {result.metrics.wins}W / {result.metrics.losses}L
                </div>
              </div>

              <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Win Rate</span>
                <div className={`text-xl font-bold font-mono mt-1 ${
                  result.metrics.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {result.metrics.winRate}%
                </div>
                <div className="text-[10px] text-slate-500">
                  {result.metrics.consecutiveWins} Max Consec W
                </div>
              </div>

              <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Profit Factor</span>
                <div className={`text-xl font-bold font-mono mt-1 ${
                  result.metrics.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-slate-200'
                }`}>
                  {result.metrics.profitFactor.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Expectancy: ${result.metrics.expectancy}
                </div>
              </div>

              <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Net Profit</span>
                <div className={`text-xl font-bold font-mono mt-1 ${
                  result.metrics.netResult >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {result.metrics.netResult >= 0 ? '+' : ''}${result.metrics.netResult.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {result.metrics.netResultPercent}% ROI
                </div>
              </div>

              <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Max Drawdown</span>
                <div className="text-xl font-bold font-mono text-red-400 mt-1">
                  -${result.metrics.maxDrawdown.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {result.metrics.maxDrawdownPercent}% of Peak
                </div>
              </div>

              <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Average R:R</span>
                <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {result.metrics.averageR}R
                </div>
                <div className="text-[10px] text-slate-500">
                  Avg Hold: {result.metrics.averageHoldingBars} bars
                </div>
              </div>
            </div>

            {/* Trade Log Table */}
            <Card className="bg-slate-900/90 border-slate-800 overflow-hidden">
              <CardHeader className="py-3 px-5 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Historical Chronological Trade Audit Log ({result.trades.length} Simulated Trades)
                </CardTitle>
                <span className="text-[10px] font-mono text-slate-500">
                  Strategy: {result.strategyVersion}
                </span>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                {result.trades.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No confirmed setups triggered during this historical window with current strict SMC rules.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
                      <tr>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-3">Direction</th>
                        <th className="py-2.5 px-3">Setup</th>
                        <th className="py-2.5 px-3">Entry</th>
                        <th className="py-2.5 px-3">Exit</th>
                        <th className="py-2.5 px-3">Outcome</th>
                        <th className="py-2.5 px-3">P&L ($)</th>
                        <th className="py-2.5 px-3">Return (R)</th>
                        <th className="py-2.5 px-3">MFE / MAE</th>
                        <th className="py-2.5 px-4">Exit Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {result.trades.map((trade, i) => (
                        <tr key={i} className="hover:bg-slate-850/40 transition-colors">
                          <td className="py-2 px-4 text-slate-500 font-bold">{i + 1}</td>
                          <td className="py-2 px-3">
                            <Badge variant={trade.direction === 'BUY' ? 'bullish' : 'bearish'} className="text-[10px] px-1.5 py-0 font-bold">
                              {trade.direction}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-300 text-[11px]">{trade.setupType.replace(/_/g, ' ')}</td>
                          <td className="py-2 px-3 text-slate-200">${trade.entryPrice.toFixed(2)}</td>
                          <td className="py-2 px-3 text-slate-300">${trade.exitPrice.toFixed(2)}</td>
                          <td className="py-2 px-3">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              trade.result === 'WIN' ? 'bg-emerald-500/10 text-emerald-400' :
                              trade.result === 'LOSS' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {trade.result}
                            </span>
                          </td>
                          <td className={`py-2 px-3 font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </td>
                          <td className={`py-2 px-3 font-bold ${trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-400">
                            {trade.maxFavorableExcursion}R / {trade.maxAdverseExcursion}R
                          </td>
                          <td className="py-2 px-4 font-sans text-[11px] text-slate-400 max-w-xs truncate" title={trade.exitReason}>
                            {trade.exitReason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
