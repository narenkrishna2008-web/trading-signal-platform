'use client';

import React, { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  IChartApi,
  LineStyle,
  UTCTimestamp,
} from 'lightweight-charts';
import type { Candle } from '@/lib/types/market';
import type { SignalResult } from '@/lib/types/strategy';

interface ZoneChartProps {
  bars: Candle[];
  signal: SignalResult;
  height?: number;
}

/**
 * A small, non-interactive mini chart that renders candlesticks with
 * supply/demand zone shading and entry/SL/TP price lines drawn on it.
 * Used inside signal cards to give traders a visual of where the zone is.
 */
export function ZoneChart({ bars, signal, height = 200 }: ZoneChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || !bars || bars.length === 0) return;

    // Cleanup previous
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = containerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth || 400,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0c1120' },
        textColor: '#64748b',
        fontSize: 10,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.3)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.3)' },
      },
      crosshair: {
        mode: 0, // Normal
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        visible: false, // hide time axis for compact view
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    // Add candlestick series
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Sort and deduplicate bars
    const sorted = [...bars].sort((a, b) => a.timestamp - b.timestamp);
    const uniqueMap = new Map<number, Candle>();
    for (const b of sorted) {
      uniqueMap.set(Math.floor(b.timestamp / 1000), b);
    }

    const chartData = Array.from(uniqueMap.values()).map(b => ({
      time: Math.floor(b.timestamp / 1000) as UTCTimestamp,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    try {
      series.setData(chartData);

      // Draw zone as a shaded band using two price lines
      if (signal.activeZone) {
        const zone = signal.activeZone;
        const zoneColor = zone.type === 'DEMAND' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        const zoneBorderColor = zone.type === 'DEMAND' ? '#059669' : '#dc2626';

        series.createPriceLine({
          price: zone.high,
          color: zoneBorderColor,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `${zone.type} Zone High`,
        });
        series.createPriceLine({
          price: zone.low,
          color: zoneBorderColor,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `${zone.type} Zone Low`,
        });
      }

      // Draw entry line
      if (signal.entry) {
        series.createPriceLine({
          price: signal.entry,
          color: '#3b82f6',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `▶ ENTRY ${signal.direction || ''}`,
        });
      }

      // Draw stop loss
      if (signal.stopLoss) {
        series.createPriceLine({
          price: signal.stopLoss,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: '✕ STOP LOSS',
        });
      }

      // Draw take profits
      if (signal.takeProfits) {
        signal.takeProfits.forEach(tp => {
          series.createPriceLine({
            price: tp.price,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `TP${tp.level} (${tp.rMultiple}R)`,
          });
        });
      }

      chart.timeScale().fitContent();
    } catch (e) {
      console.warn('[ZoneChart] Failed to render:', e);
    }

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [bars, signal, height]);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-slate-800 bg-[#0c1120]">
      {/* Mini Chart Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[10px]">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-300">Zone Chart</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono">{signal.executionTimeframe}</span>
          {signal.activeZone && (
            <>
              <span className="text-slate-500">·</span>
              <span className={`font-bold ${signal.activeZone.type === 'DEMAND' ? 'text-emerald-400' : 'text-red-400'}`}>
                {signal.activeZone.type} Zone
              </span>
              <span className="text-slate-500 font-mono">
                ${signal.activeZone.low.toFixed(2)} – ${signal.activeZone.high.toFixed(2)}
              </span>
            </>
          )}
        </div>
        {signal.entry && (
          <span className="text-blue-400 font-mono font-semibold">
            Entry: ${signal.entry.toFixed(2)}
          </span>
        )}
      </div>
      {/* Chart Container */}
      <div ref={containerRef} style={{ height: `${height}px` }} className="w-full" />
    </div>
  );
}
