import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding trading platform database...');

  // 1. Seed Instruments
  const xau = await prisma.instrument.upsert({
    where: { symbol: 'XAU/USD' },
    update: {},
    create: {
      symbol: 'XAU/USD',
      assetClass: 'commodity',
      displayName: 'Gold Spot vs US Dollar',
      config: JSON.stringify({
        tickSize: 0.01,
        pipSize: 0.1,
        minOrderSize: 0.01,
        maxOrderSize: 100,
        marginRequired: 0.01,
        spreadTypical: 0.20,
        tradingHours: '24/5',
        primaryTimeframe: '15M',
        contextTimeframe: '4H',
      }),
    },
  });

  await prisma.instrument.upsert({
    where: { symbol: 'BTC/USD' },
    update: {},
    create: {
      symbol: 'BTC/USD',
      assetClass: 'crypto',
      displayName: 'Bitcoin vs US Dollar',
      config: JSON.stringify({ tickSize: 0.1, pipSize: 1.0 }),
    },
  });

  await prisma.instrument.upsert({
    where: { symbol: 'ETH/USD' },
    update: {},
    create: {
      symbol: 'ETH/USD',
      assetClass: 'crypto',
      displayName: 'Ethereum vs US Dollar',
      config: JSON.stringify({ tickSize: 0.01, pipSize: 0.1 }),
    },
  });

  // 2. Seed Signals
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const fiveHoursAgo = new Date(now.getTime() - 18000000);
  const oneDayAgo = new Date(now.getTime() - 86400000);

  const signal1 = await prisma.signalRecord.create({
    data: {
      instrumentId: xau.id,
      direction: 'BUY',
      setupType: '15M Demand Retest + CHOCH',
      lifecycle: 'TP2_HIT',
      status: 'STRONG_BUY',
      entry: 2648.20,
      stopLoss: 2642.50,
      tp1: 2656.75,
      tp2: 2662.50,
      tp3: 2671.00,
      riskReward: 2.5,
      confidence: 84,
      qualityTier: 'HIGH_CONFLUENCE',
      reasons: JSON.stringify([
        { category: 'HTF_STRUCTURE', message: '4H bullish structure confirmed (HH/HL)', passed: true, score: 20 },
        { category: 'ZONE', message: 'Price retesting fresh 15M demand zone [2642.50 - 2648.00]', passed: true, score: 15 },
        { category: 'LIQUIDITY', message: 'Sell-side liquidity at $2643.00 swept with immediate reclaim', passed: true, score: 15 },
        { category: 'STRUCTURE', message: '15M bullish CHOCH confirmed at $2647.80', passed: true, score: 20 },
        { category: 'DISPLACEMENT', message: 'Displacement confirmed (ATR×1.42, body ratio 78%)', passed: true, score: 10 },
        { category: 'CONFIRMATION', message: 'Bullish engulfing candle on closed 15M bar', passed: true, score: 10 },
      ]),
      warnings: JSON.stringify([]),
      strategyVersion: 'XAU-SMC-1.0.0',
      dataSource: 'YahooFinance (Live Spot/Futures)',
      createdAt: oneHourAgo,
      triggeredAt: oneHourAgo,
      outcome: 'WIN',
      maxFavorableExcursion: 2.8,
      maxAdverseExcursion: 0.3,
    },
  });

  await prisma.signalRecord.create({
    data: {
      instrumentId: xau.id,
      direction: 'SELL',
      setupType: 'Liquidity Sweep + CHOCH',
      lifecycle: 'TP2_HIT',
      status: 'STRONG_SELL',
      entry: 2665.40,
      stopLoss: 2670.00,
      tp1: 2658.50,
      tp2: 2653.90,
      tp3: 2645.00,
      riskReward: 2.5,
      confidence: 78,
      qualityTier: 'HIGH_CONFLUENCE',
      reasons: JSON.stringify([
        { category: 'HTF_STRUCTURE', message: '4H bearish rejection from supply zone', passed: true, score: 20 },
        { category: 'ZONE', message: 'Price at tested 15M supply zone [2665.00 - 2669.50]', passed: true, score: 15 },
        { category: 'LIQUIDITY', message: 'Buy-side liquidity swept at $2668.50', passed: true, score: 15 },
        { category: 'STRUCTURE', message: '15M bearish CHOCH confirmed', passed: true, score: 20 },
      ]),
      warnings: JSON.stringify([]),
      strategyVersion: 'XAU-SMC-1.0.0',
      dataSource: 'YahooFinance (Live Spot/Futures)',
      createdAt: fiveHoursAgo,
      outcome: 'WIN',
      maxFavorableExcursion: 2.6,
      maxAdverseExcursion: 0.4,
    },
  });

  // 3. Seed Journal Entry linked to Signal 1
  await prisma.journalEntryRecord.create({
    data: {
      symbol: 'XAU/USD',
      direction: 'BUY',
      setupType: '15M Demand Retest + CHOCH',
      entryPrice: 2648.20,
      stopLoss: 2642.50,
      takeProfit: 2662.50,
      result: 'WIN',
      pnl: 285.00,
      notes: 'Executed exactly according to 15M demand retest signal. Waited for candle close before entering. Exited at TP2 smoothly.',
      emotionalState: 'Disciplined / Calm',
      ruleFollowingScore: 10,
      mistakeCategory: 'None (Followed Plan)',
      linkedSignalId: signal1.id,
      createdAt: oneHourAgo,
    },
  });

  // 4. Seed App Settings
  await prisma.appSetting.upsert({
    where: { key: 'strategyConfig' },
    update: {},
    create: {
      key: 'strategyConfig',
      value: JSON.stringify({
        version: 'XAU-SMC-1.0.0',
        higherTimeframe: '4H',
        executionTimeframe: '15M',
        riskPerTrade: 1.0,
        accountSize: 10000,
        defaultTimezone: 'Asia/Kolkata',
      }),
    },
  });

  console.log('Database seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
