import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerManager } from '@/lib/providers/provider-manager';
import { runBacktest } from '@/lib/engine/backtester';
import { DEFAULT_STRATEGY_CONFIG } from '@/lib/types/strategy';

export async function GET(request: NextRequest) {
  try {
    const backtests = await db.backtestRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formatted = backtests.map(bt => ({
      ...bt,
      config: JSON.parse(bt.config),
      metrics: JSON.parse(bt.metrics),
      trades: JSON.parse(bt.trades),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[API /backtest GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch backtest history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symbol = body.symbol || 'XAU/USD';
    const startingBalance = body.startingBalance ? Number(body.startingBalance) : 10000;
    const riskPerTrade = body.riskPerTrade ? Number(body.riskPerTrade) : 1.0;
    const spread = body.spread !== undefined ? Number(body.spread) : 0.20;
    const slippage = body.slippage !== undefined ? Number(body.slippage) : 0.05;

    await providerManager.initialize();

    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    const fromTime = body.from ? Number(body.from) : now - ninetyDaysMs;
    const toTime = body.to ? Number(body.to) : now;

    // Fetch bars for backtesting
    const [bars4H, bars15M] = await Promise.all([
      providerManager.getHistoricalBars(symbol, '4H', fromTime, toTime, 250),
      providerManager.getHistoricalBars(symbol, '15M', fromTime, toTime, 1000),
    ]);

    // Execute genuine chronological backtest
    const result = runBacktest({
      symbol,
      bars4H,
      bars15M,
      startingBalance,
      riskPerTradePct: riskPerTrade,
      spread,
      slippage,
      strategyConfig: body.strategyConfig || DEFAULT_STRATEGY_CONFIG,
    });

    // Ensure instrument exists in db for relation
    let instrument = await db.instrument.findUnique({
      where: { symbol },
    });

    if (!instrument) {
      instrument = await db.instrument.create({
        data: {
          symbol,
          assetClass: 'commodity',
          displayName: 'Gold Spot',
          config: JSON.stringify({}),
        },
      });
    }

    // Persist result in database
    const saved = await db.backtestRecord.create({
      data: {
        instrumentId: instrument.id,
        config: JSON.stringify(result.config),
        metrics: JSON.stringify(result.metrics),
        trades: JSON.stringify(result.trades),
        strategyVersion: result.strategyVersion,
        completedAt: new Date(result.completedAt),
      },
    });

    return NextResponse.json({
      ...result,
      dbId: saved.id,
    }, { status: 201 });
  } catch (error) {
    console.error('[API /backtest POST] Error executing backtest:', error);
    return NextResponse.json(
      { error: 'Failed to execute backtest', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
