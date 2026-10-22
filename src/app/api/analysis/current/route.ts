import { NextRequest, NextResponse } from 'next/server';
import { providerManager } from '@/lib/providers/provider-manager';
import { evaluateMarket, generateChecklist } from '@/lib/engine/signal-engine';
import { DEFAULT_STRATEGY_CONFIG } from '@/lib/types/strategy';
import { macroCalendar } from '@/lib/engine/macro-calendar';
import { globalContextEngine } from '@/lib/engine/global-context';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'XAU/USD';
  const executionTf = searchParams.get('timeframe') || '15M';

  try {
    await providerManager.initialize();

    const now = Date.now();
    const fourWeeksMs = 28 * 24 * 60 * 60 * 1000;
    const fromTime = now - fourWeeksMs;

    const limitForTf = executionTf === '5M' ? 150 : executionTf === '1H' ? 100 : executionTf === '4H' ? 80 : 120;

    // Fetch 4H HTF and requested execution timeframe bars in parallel
    const [bars4H, executionBars, quote, globalContext] = await Promise.all([
      providerManager.getHistoricalBars(symbol, '4H', fromTime, now, 80),
      providerManager.getHistoricalBars(symbol, executionTf as any, fromTime, now, limitForTf),
      providerManager.getLatestQuote(symbol),
      globalContextEngine.getGlobalContext(),
    ]);

    const activeProviderName = providerManager.getActiveProviderName();
    const currentPrice = quote?.mid || (executionBars.length > 0 ? executionBars[executionBars.length - 1].close : 4060.0);
    const macroState = macroCalendar.getCalendarState(now);

    const config = {
      ...DEFAULT_STRATEGY_CONFIG,
      executionTimeframe: executionTf as any,
    };

    const isDataFresh = quote ? (now - quote.timestamp < 60000) : true;

    // Run the deterministic signal engine
    const signal = evaluateMarket({
      candles4H: bars4H,
      candles15M: executionBars,
      currentPrice,
      symbol,
      config,
      dataSource: activeProviderName,
      dataFresh: isDataFresh,
      macroBlackout: macroState.isBlackoutActive,
    });

    // Record into live signal store for history
    if (signal.entry && signal.stopLoss) {
      const { signalStore } = await import('@/lib/engine/signal-store');
      signalStore.record(signal, executionTf);
    }

    const checklist = generateChecklist(signal);

    return NextResponse.json({
      symbol,
      currentPrice,
      quote,
      signal,
      checklist,
      bias: signal.htfBias,
      activeZone: signal.activeZone,
      liquiditySweep: signal.activeLiquiditySweep,
      structureEvent: signal.structureEvent,
      displacement: signal.displacement,
      candleConfirmation: signal.candleConfirmation,
      currentSession: signal.currentSession,
      dataSource: activeProviderName,
      dataFresh: isDataFresh,
      macroContext: macroState,
      globalContext,
      timestamp: now,
    });
  } catch (error) {
    console.error('[API /analysis/current] Error during market evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate market signal engine', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
