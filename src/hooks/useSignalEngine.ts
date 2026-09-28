import { useState, useEffect, useCallback } from 'react';
import type { SignalResult, SetupChecklist, BiasAssessment } from '@/lib/types/strategy';
import type { Quote } from '@/lib/types/market';
import type { GlobalContextState } from '@/lib/engine/global-context';
import type { MacroCalendarState } from '@/lib/engine/macro-calendar';

export interface SignalEngineState {
  signal: SignalResult | null;
  checklist: SetupChecklist | null;
  bias: BiasAssessment | null;
  globalContext: GlobalContextState | null;
  macroContext: MacroCalendarState | null;
  currentPrice: number;
  quote: Quote | null;
  dataSource: string;
  dataFresh: boolean;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useSignalEngine(symbol: string = 'XAU/USD', timeframe: string = '15M'): SignalEngineState {
  const [signal, setSignal] = useState<SignalResult | null>(null);
  const [checklist, setChecklist] = useState<SetupChecklist | null>(null);
  const [bias, setBias] = useState<BiasAssessment | null>(null);
  const [globalContext, setGlobalContext] = useState<GlobalContextState | null>(null);
  const [macroContext, setMacroContext] = useState<MacroCalendarState | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(2650.0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [dataSource, setDataSource] = useState<string>('Initializing...');
  const [dataFresh, setDataFresh] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await fetch(`/api/analysis/current?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setSignal(data.signal || null);
      setChecklist(data.checklist || null);
      setBias(data.bias || null);
      setGlobalContext(data.globalContext || null);
      setMacroContext(data.macroContext || null);
      setCurrentPrice(data.currentPrice || 2650.0);
      setQuote(data.quote || null);
      setDataSource(data.dataSource || 'DEMO');
      setDataFresh(data.dataFresh ?? true);
      setError(null);
    } catch (err) {
      console.warn('[useSignalEngine] Error fetching analysis:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    setLoading(true);
    fetchAnalysis();

    // Auto-refresh every 5 seconds for live signal engine responsiveness
    const timer = setInterval(fetchAnalysis, 5000);
    return () => clearInterval(timer);
  }, [fetchAnalysis]);

  return {
    signal,
    checklist,
    bias,
    globalContext,
    macroContext,
    currentPrice,
    quote,
    dataSource,
    dataFresh,
    loading,
    error,
    refresh: fetchAnalysis,
  };
}
