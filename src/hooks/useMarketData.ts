import { useState, useEffect, useCallback } from 'react';
import type { Quote, Candle, Timeframe } from '@/lib/types/market';

export interface MarketDataState {
  quote: Quote | null;
  bars: Candle[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useMarketData(symbol: string = 'XAU/USD', timeframe: Timeframe = '15M'): MarketDataState {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [bars, setBars] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const now = Date.now();
      const lookbackMs = 14 * 24 * 60 * 60 * 1000; // 14 days
      const from = now - lookbackMs;

      const [barsRes, quoteRes] = await Promise.all([
        fetch(`/api/market/bars?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&from=${from}&to=${now}&limit=150`),
        fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`),
      ]);

      if (barsRes.ok) {
        const barsData = await barsRes.json();
        if (Array.isArray(barsData.data) && barsData.data.length > 0) {
          setBars(barsData.data);
        }
      }

      if (quoteRes.ok) {
        const quoteData = await quoteRes.json();
        if (quoteData && quoteData.mid > 0) {
          setQuote(quoteData);
        }
      }

      setError(null);
    } catch (err) {
      console.warn('[useMarketData] Fetch error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    setLoading(true);
    fetchData();

    // Poll quote every 3 seconds, full bars every 10 seconds
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { quote, bars, loading, error, refresh: fetchData };
}
