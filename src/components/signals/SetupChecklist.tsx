'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CheckCircle2, Circle, XCircle, AlertCircle } from 'lucide-react';
import type { SetupChecklist as SetupChecklistType, ChecklistItem } from '@/lib/types/strategy';

interface SetupChecklistProps {
  checklist?: SetupChecklistType | null;
}

export function SetupChecklist({ checklist }: SetupChecklistProps) {
  const items: ChecklistItem[] = checklist ? [
    checklist.htfTrend,
    checklist.htfStructure,
    checklist.keyZone,
    checklist.liquidity,
    checklist.ltfStructure,
    checklist.displacement,
    checklist.retest,
    checklist.candleConfirmation,
    checklist.riskCheck,
  ].filter(Boolean) : [
    { label: '4H Trend', status: 'WAITING', detail: 'Evaluating 4H swing structure' },
    { label: '4H Structure', status: 'WAITING', detail: 'HH/HL or LH/LL sequence' },
    { label: 'Key Zone', status: 'WAITING', detail: 'Fresh supply/demand zone' },
    { label: 'Liquidity', status: 'WAITING', detail: 'Liquidity sweep verification' },
    { label: '15M Structure', status: 'WAITING', detail: '15M CHOCH / BOS confirmation' },
    { label: 'Displacement', status: 'WAITING', detail: 'Candle range > ATR multiple' },
    { label: 'Retest', status: 'WAITING', detail: 'Order block / zone retest' },
    { label: 'Candle Confirmation', status: 'WAITING', detail: 'Engulfing or rejection pin bar' },
    { label: 'Risk Check', status: 'WAITING', detail: 'Minimum 1:2.0 R:R check' },
  ];

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'WAITING':
        return <Circle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  const passedCount = items.filter(i => i.status === 'PASSED').length;
  const statusLabel = checklist?.signalStatus ? checklist.signalStatus.replace(/_/g, ' ') : 'EVALUATING';

  return (
    <Card className="h-full flex flex-col bg-slate-900/90 border-slate-800">
      <CardHeader className="py-2.5 px-4 border-b border-slate-800/80 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Setup Progress Checklist
          </CardTitle>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {passedCount}/{items.length} CONFIRMED
          </span>
        </div>

        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
          statusLabel.includes('BUY') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
          statusLabel.includes('SELL') ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
          'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {statusLabel}
        </span>
      </CardHeader>

      <CardContent className="p-3 flex-1 overflow-y-auto space-y-1.5 text-xs">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-start justify-between p-1.5 rounded transition-colors ${
              item.status === 'PASSED'
                ? 'bg-emerald-950/20 border border-emerald-900/30'
                : item.status === 'WAITING'
                ? 'bg-slate-950/40 border border-slate-800/50'
                : 'bg-red-950/20 border border-red-900/30'
            }`}
          >
            <div className="flex items-start space-x-2 min-w-0 pr-2">
              <div className="mt-0.5">{getStatusIcon(item.status)}</div>
              <div className="flex flex-col min-w-0">
                <span className={`font-semibold tracking-tight text-[11px] ${
                  item.status === 'PASSED' ? 'text-slate-100' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-500 truncate" title={item.detail}>
                  {item.detail}
                </span>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${
              item.status === 'PASSED'
                ? 'text-emerald-400 bg-emerald-500/10'
                : item.status === 'WAITING'
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-red-400 bg-red-500/10'
            }`}>
              {item.status}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
