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

    // Fetch 4H and 15M bars in parallel
    const [bars4H, bars15M, quote, globalContext] = await Promise.all([
      providerManager.getHistoricalBars(symbol, '4H', fromTime, now, 80),
      providerManager.getHistoricalBars(symbol, '15M', fromTime, now, 120),
      providerManager.getLatestQuote(symbol),
      globalContextEngine.getGlobalContext(),
    ]);

    const activeProviderName = providerManager.getActiveProviderName();
    const currentPrice = quote?.mid || (bars15M.length > 0 ? bars15M[bars15M.length - 1].close : 2650.0);
    const macroState = macroCalendar.getCalendarState(now);

    const config = {
      ...DEFAULT_STRATEGY_CONFIG,
      executionTimeframe: executionTf as any,
    };

    const isDataFresh = quote ? (now - quote.timestamp < 60000) : true;

    // Run the deterministic signal engine
    const signal = evaluateMarket({
      candles4H: bars4H,
      candles15M: bars15M,
      currentPrice,
      symbol,
      config,
      dataSource: activeProviderName,
      dataFresh: isDataFresh,
      macroBlackout: macroState.isBlackoutActive,
    });

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
