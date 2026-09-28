import { useState, useEffect } from 'react';
import type { ProviderHealth } from '@/lib/types/market';

export interface HealthState {
  status: 'LIVE' | 'DEGRADED' | 'STALE' | 'OFFLINE';
  providerName: string;
  latencyMs: number;
  lastTick: number | null;
  databaseStatus: 'OK' | 'ERROR' | 'UNKNOWN';
}

export function useDataHealth(fallbackProvider: string = 'LiveProvider') {
  const [health, setHealth] = useState<HealthState>({
    status: 'LIVE',
    providerName: fallbackProvider,
    latencyMs: 85,
    lastTick: Date.now(),
    databaseStatus: 'OK',
  });

  useEffect(() => {
    const checkHealth = async () => {
      const startTime = performance.now();
      try {
        const res = await fetch('/api/health');
        const latency = Math.round(performance.now() - startTime);

        if (res.ok) {
          const data = await res.json();
          const primaryProvider = data.subsystems?.providers?.[0];
          setHealth({
            status: primaryProvider?.status || (data.status === 'OK' ? 'LIVE' : 'DEGRADED'),
            providerName: primaryProvider?.provider || fallbackProvider,
            latencyMs: latency,
            lastTick: primaryProvider?.lastTick || Date.now(),
            databaseStatus: data.subsystems?.database || 'OK',
          });
        }
      } catch {
        setHealth(prev => ({ ...prev, status: 'DEGRADED', latencyMs: 999 }));
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [fallbackProvider]);

  return { status: health };
}
