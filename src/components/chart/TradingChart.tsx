'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi, LineStyle, UTCTimestamp } from 'lightweight-charts';
import type { Candle, Timeframe } from '@/lib/types/market';
import type { SignalResult, Zone } from '@/lib/types/strategy';

interface TradingChartProps {
  symbol?: string;
  timeframe?: Timeframe;
  bars?: Candle[];
  signal?: SignalResult | null;
  onTimeframeChange?: (tf: Timeframe) => void;
}

export function TradingChart({
  symbol = 'XAU/USD',
  timeframe = '15M',
  bars = [],
  signal = null,
  onTimeframeChange,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);

  const [activeTf, setActiveTf] = useState<Timeframe>(timeframe);
  const [showLevels, setShowLevels] = useState(true);
  const [showZones, setShowZones] = useState(true);

  const timeframes: Timeframe[] = ['1M', '5M', '15M', '30M', '1H', '4H', '1D'];

  // Handle timeframe change
  const handleTfChange = (tf: Timeframe) => {
    setActiveTf(tf);
    if (onTimeframeChange) onTimeframeChange(tf);
  };

  // Initialize Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: container.clientHeight || 450,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)' },
      },
      crosshair: {
        vertLine: {
          color: '#64748b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: '#64748b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // Emerald 500
      downColor: '#ef4444', // Red 500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Update Candlestick Data
  useEffect(() => {
    if (!seriesRef.current || !bars || bars.length === 0) return;

    // Sort bars by timestamp ascending, dedup
    const sorted = [...bars].sort((a, b) => a.timestamp - b.timestamp);
    const uniqueMap = new Map<number, Candle>();
    for (const b of sorted) {
      const timeSec = Math.floor(b.timestamp / 1000);
      uniqueMap.set(timeSec, b);
    }

    const chartData = Array.from(uniqueMap.values()).map(b => ({
      time: Math.floor(b.timestamp / 1000) as UTCTimestamp,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    try {
      seriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();
    } catch (e) {
      console.warn('[TradingChart] Failed to set series data:', e);
    }
  }, [bars]);

  // Update Price Lines for Signal (Entry, Stop Loss, TP1, TP2, TP3)
  useEffect(() => {
    if (!seriesRef.current) return;

    // Remove existing price lines
    for (const line of priceLinesRef.current) {
      try {
        seriesRef.current.removePriceLine(line);
      } catch {}
    }
    priceLinesRef.current = [];

    if (!showLevels || !signal || !signal.entry || !signal.stopLoss) return;

    try {
      // Entry Line (Blue)
      const entryLine = seriesRef.current.createPriceLine({
        price: signal.entry,
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `ENTRY ${signal.direction || ''}`,
      });
      priceLinesRef.current.push(entryLine);

      // Stop Loss Line (Red)
      const slLine = seriesRef.current.createPriceLine({
        price: signal.stopLoss,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: 'STOP LOSS (INVALIDATION)',
      });
      priceLinesRef.current.push(slLine);

      // Take Profit Lines (Green)
      if (signal.takeProfits) {
        signal.takeProfits.forEach(tp => {
          const tpLine = seriesRef.current?.createPriceLine({
            price: tp.price,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `TP${tp.level} (${tp.rMultiple}R)`,
          });
          if (tpLine) priceLinesRef.current.push(tpLine);
        });
      }

      // Active Zone Boundary lines if active
      if (showZones && signal.activeZone) {
        const zone = signal.activeZone;
        const zoneColor = zone.type === 'DEMAND' ? '#059669' : '#dc2626';

        const zoneHighLine = seriesRef.current.createPriceLine({
          price: zone.high,
          color: zoneColor,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: false,
          title: `${zone.type} HIGH`,
        });
        const zoneLowLine = seriesRef.current.createPriceLine({
          price: zone.low,
          color: zoneColor,
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: false,
          title: `${zone.type} LOW`,
        });

        priceLinesRef.current.push(zoneHighLine, zoneLowLine);
      }
    } catch (e) {
      console.warn('[TradingChart] Failed to create price lines:', e);
    }
  }, [signal, showLevels, showZones]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      {/* Chart Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2 border-b border-slate-800 bg-slate-900/60 gap-2 shrink-0">
        {/* Symbol & Timeframe */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm tracking-wide text-amber-400 pl-1">{symbol}</span>
          <span className="text-slate-600 text-xs">|</span>
          <div className="flex items-center space-x-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTfChange(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  activeTf === tf
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShowLevels(!showLevels)}
            className={`px-2 py-1 rounded border transition-colors ${
              showLevels
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Signal Levels
          </button>
          <button
            onClick={() => setShowZones(!showZones)}
            className={`px-2 py-1 rounded border transition-colors ${
              showZones
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            SMC Zones
          </button>
        </div>
      </div>

      {/* Chart Rendering Viewport */}
      <div ref={chartContainerRef} className="flex-1 w-full h-full relative" />
    </div>
  );
}
