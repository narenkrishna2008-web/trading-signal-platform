'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Timeframe } from '@/lib/types/market';
import type { SignalResult, Zone } from '@/lib/types/strategy';

export interface TimeframeSignalData {
  timeframe: Timeframe;
  signal: SignalResult | null;
  activeZone: Zone | null;
  currentPrice: number;
  loading: boolean;
  error: string | null;
  updatedAt: number;
}

const SUPPORTED_TIMEFRAMES: Timeframe[] = ['5M', '15M', '1H', '4H'];

export function useMultiTimeframeSignals(symbol: string = 'XAU/USD') {
  const [signals, setSignals] = useState<Partial<Record<Timeframe, TimeframeSignalData>>>({
    '5M': { timeframe: '5M', signal: null, activeZone: null, currentPrice: 0, loading: true, error: null, updatedAt: 0 },
    '15M': { timeframe: '15M', signal: null, activeZone: null, currentPrice: 0, loading: true, error: null, updatedAt: 0 },
    '1H': { timeframe: '1H', signal: null, activeZone: null, currentPrice: 0, loading: true, error: null, updatedAt: 0 },
    '4H': { timeframe: '4H', signal: null, activeZone: null, currentPrice: 0, loading: true, error: null, updatedAt: 0 },
  });

  const [overallLoading, setOverallLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchTimeframe = async (tf: Timeframe): Promise<TimeframeSignalData> => {
    try {
      const res = await fetch(`/api/analysis/current?symbol=${encodeURIComponent(symbol)}&timeframe=${tf}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return {
        timeframe: tf,
        signal: data.signal || null,
        activeZone: data.activeZone || data.signal?.activeZone || null,
        currentPrice: data.currentPrice || 0,
        loading: false,
        error: null,
        updatedAt: Date.now(),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fetch failed';
      return {
        timeframe: tf,
        signal: null,
        activeZone: null,
        currentPrice: 0,
        loading: false,
        error: msg,
        updatedAt: Date.now(),
      };
    }
  };

  const fetchAll = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const results = await Promise.all(SUPPORTED_TIMEFRAMES.map((tf) => fetchTimeframe(tf)));
      const nextMap: Partial<Record<Timeframe, TimeframeSignalData>> = { ...signals };
      for (const item of results) {
        nextMap[item.timeframe] = item;
      }
      setSignals(nextMap);
      setOverallLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [symbol]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 12000); // 12-second refresh
    return () => clearInterval(interval);
  }, [fetchAll]);

  return {
    signals,
    loading: overallLoading,
    refresh: fetchAll,
  };
}
