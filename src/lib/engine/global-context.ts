/**
 * Global Market Context & DXY Intelligence Engine
 * Ingests inter-market relationships (DXY Dollar Index, US 10-Year Treasury Yields, S&P 500, Crude)
 * to provide institutional macro context specifically for XAU/USD.
 */

import { providerManager } from '../providers/provider-manager';

export interface GlobalMarketAsset {
  symbol: string;
  name: string;
  category: string;
  price: number;
  change: number;
  changePct: number;
  status: 'LIVE' | 'SIMULATED';
  goldCorrelation: 'NEGATIVE' | 'POSITIVE' | 'NEUTRAL';
}

export interface GlobalContextState {
  dxy: GlobalMarketAsset;
  us10y: GlobalMarketAsset;
  sp500: GlobalMarketAsset;
  brentCrude: GlobalMarketAsset;
  gold: GlobalMarketAsset;
  macroSentimentScore: number; // -100 (Strong Gold Headwinds / Super Dollar) to +100 (Strong Gold Tailwinds / Weak Dollar)
  goldRegime: 'BULLISH_TAILWINDS' | 'BEARISH_HEADWINDS' | 'NEUTRAL_BALANCED';
  dxyTrend: 'BULLISH' | 'BEARISH' | 'RANGING';
  tacticalNote: string;
  timestamp: number;
}

export class GlobalContextEngine {
  async getGlobalContext(): Promise<GlobalContextState> {
    const now = Date.now();

    // Default institutional baseline
    const defaults = {
      dxy: { price: 100.85, change: -0.25, changePct: -0.25 },
      us10y: { price: 3.74, change: -0.05, changePct: -1.32 },
      sp500: { price: 5760.50, change: 22.10, changePct: 0.38 },
      brentCrude: { price: 73.80, change: -0.50, changePct: -0.67 },
      gold: { price: 2655.40, change: 12.80, changePct: 0.48 },
    };

    let dxyQuote = await providerManager.getLatestQuote('DXY');
    let goldQuote = await providerManager.getLatestQuote('XAU/USD');
    let sp500Quote = await providerManager.getLatestQuote('SPY');

    const dxyPrice = dxyQuote?.mid || defaults.dxy.price;
    const goldPrice = goldQuote?.mid || defaults.gold.price;
    const spPrice = (sp500Quote?.mid ? sp500Quote.mid * 10 : defaults.sp500.price);

    const dxyAsset: GlobalMarketAsset = {
      symbol: 'DXY',
      name: 'US Dollar Index',
      category: 'Currency / Global Liquidity',
      price: Number(dxyPrice.toFixed(2)),
      change: defaults.dxy.change,
      changePct: defaults.dxy.changePct,
      status: dxyQuote ? 'LIVE' : 'SIMULATED',
      goldCorrelation: 'NEGATIVE',
    };

    const us10yAsset: GlobalMarketAsset = {
      symbol: 'US10Y',
      name: 'US 10-Yr Treasury Yield (%)',
      category: 'Bonds / Real Yields',
      price: defaults.us10y.price,
      change: defaults.us10y.change,
      changePct: defaults.us10y.changePct,
      status: 'SIMULATED',
      goldCorrelation: 'NEGATIVE',
    };

    const sp500Asset: GlobalMarketAsset = {
      symbol: 'SP500',
      name: 'S&P 500 Index',
      category: 'US Equity / Risk Appetite',
      price: Number(spPrice.toFixed(2)),
      change: defaults.sp500.change,
      changePct: defaults.sp500.changePct,
      status: sp500Quote ? 'LIVE' : 'SIMULATED',
      goldCorrelation: 'NEUTRAL',
    };

    const brentAsset: GlobalMarketAsset = {
      symbol: 'BRENT',
      name: 'Brent Crude Oil ($/bbl)',
      category: 'Commodity / Headline Inflation',
      price: defaults.brentCrude.price,
      change: defaults.brentCrude.change,
      changePct: defaults.brentCrude.changePct,
      status: 'SIMULATED',
      goldCorrelation: 'POSITIVE',
    };

    const goldAsset: GlobalMarketAsset = {
      symbol: 'XAU/USD',
      name: 'Gold Spot',
      category: 'Precious Metals / Monetary Store',
      price: Number(goldPrice.toFixed(2)),
      change: defaults.gold.change,
      changePct: defaults.gold.changePct,
      status: goldQuote ? 'LIVE' : 'SIMULATED',
      goldCorrelation: 'POSITIVE',
    };

    // Calculate Macro Sentiment for Gold (-100 to +100)
    // Falling DXY = Bullish Gold (+score)
    // Falling US10Y Yields = Bullish Gold (+score)
    // Rising Oil = Moderate Inflation Hedge for Gold
    const dxyFactor = -dxyAsset.changePct * 100;
    const yieldFactor = -us10yAsset.changePct * 50;
    const oilFactor = brentAsset.changePct * 20;

    const rawScore = (dxyFactor * 0.5) + (yieldFactor * 0.35) + (oilFactor * 0.15);
    const macroSentimentScore = Math.round(Math.max(-100, Math.min(100, rawScore)));

    let goldRegime: 'BULLISH_TAILWINDS' | 'BEARISH_HEADWINDS' | 'NEUTRAL_BALANCED' = 'NEUTRAL_BALANCED';
    let dxyTrend: 'BULLISH' | 'BEARISH' | 'RANGING' = 'RANGING';
    let tacticalNote = 'DXY and US Yields are consolidating. Standard SMC technical setups on 15M apply.';

    if (macroSentimentScore >= 25) {
      goldRegime = 'BULLISH_TAILWINDS';
      dxyTrend = 'BEARISH';
      tacticalNote = 'Softening DXY and declining US yields provide strong macroeconomic tailwinds for Gold longs. Demand zone retests have high confluence.';
    } else if (macroSentimentScore <= -25) {
      goldRegime = 'BEARISH_HEADWINDS';
      dxyTrend = 'BULLISH';
      tacticalNote = 'Surging US Dollar and rising Treasury yields pressure non-yielding gold. Exercise caution with aggressive longs; favor supply zone rejections.';
    }

    return {
      dxy: dxyAsset,
      us10y: us10yAsset,
      sp500: sp500Asset,
      brentCrude: brentAsset,
      gold: goldAsset,
      macroSentimentScore,
      goldRegime,
      dxyTrend,
      tacticalNote,
      timestamp: now,
    };
  }
}

export const globalContextEngine = new GlobalContextEngine();
