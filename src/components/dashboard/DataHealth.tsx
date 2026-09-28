'use client';

import React from 'react';
import { useDataHealth } from '@/hooks/useDataHealth';
import { StatusDot } from '@/components/ui/StatusDot';
import { Database, Activity, Wifi } from 'lucide-react';

export function DataHealth() {
  const { status } = useDataHealth();

  return (
    <div className="flex items-center space-x-5 text-[11px] font-mono select-none">
      {/* Feed Status */}
      <div className="flex items-center space-x-1.5">
        <StatusDot status={status.status.toLowerCase() as any} pulse={status.status === 'LIVE'} />
        <span className="text-slate-500">Feed:</span>
        <span className={`font-semibold ${
          status.status === 'LIVE' ? 'text-emerald-400' :
          status.status === 'DEGRADED' ? 'text-amber-400' : 'text-red-400'
        }`}>
          {status.status}
        </span>
      </div>

      {/* Latency */}
      <div className="flex items-center space-x-1.5">
        <Wifi className="w-3 h-3 text-slate-500" />
        <span className="text-slate-500">Ping:</span>
        <span className="text-slate-200">{status.latencyMs}ms</span>
      </div>

      {/* Database Status */}
      <div className="flex items-center space-x-1.5">
        <Database className="w-3 h-3 text-slate-500" />
        <span className="text-slate-500">DB:</span>
        <span className={status.databaseStatus === 'OK' ? 'text-emerald-400' : 'text-red-400'}>
          {status.databaseStatus}
        </span>
      </div>

      {/* Active Engine */}
      <div className="hidden sm:flex items-center space-x-1.5 text-slate-500">
        <Activity className="w-3 h-3 text-amber-500/70" />
        <span>XAU-SMC-1.0.0</span>
      </div>
    </div>
  );
}
