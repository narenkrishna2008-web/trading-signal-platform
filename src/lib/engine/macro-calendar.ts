/**
 * Macro Economic Calendar Engine
 * Tracks major macroeconomic catalysts (FOMC, CPI, NFP, GDP, Central Banks),
 * computes countdowns, determines macro volatility risk score, and manages trading blackout windows.
 */

import { MacroEvent, MacroImpact } from '../types/strategy';

export interface MacroCalendarState {
  eventsCount: number;
  highImpactCount: number;
  eventRiskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  isBlackoutActive: boolean;
  minHoursToHighImpact: number | null;
  tacticalRecommendation: string;
  events: MacroEventItem[];
}

export interface MacroEventItem extends MacroEvent {
  country: string;
  category: string;
  dateTimeStr: string;
  hoursRemaining: number;
  countdownBadge: string;
  marketImplication: string;
  goldImplication: string;
  traderAction: string;
}

export class MacroCalendarEngine {
  private baseEvents = [
    {
      title: 'US Federal Reserve FOMC Interest Rate Decision & Powell Press Conference',
      country: 'USA 🇺🇸',
      currency: 'USD',
      impact: 'HIGH' as MacroImpact,
      category: 'Central Bank',
      offsetDays: 1,
      hourUTC: 18,
      forecast: 'Fed Funds Rate 5.25%-5.50%',
      previous: '5.50%',
      marketImplication: 'Governs global liquidity and US Treasury yields. Direct inverse impact on Gold (XAU/USD).',
      goldImplication: 'Dovish pause or rate cut triggers explosive upside in Gold. Hawkish surprise triggers sharp selloff.',
      traderAction: 'Trading paused 15m before and 15m after statement. Avoid holding tight breakout orders during speech.',
    },
    {
      title: 'US Consumer Price Index (CPI) Inflation MoM / YoY',
      country: 'USA 🇺🇸',
      currency: 'USD',
      impact: 'HIGH' as MacroImpact,
      category: 'Inflation',
      offsetDays: 2,
      hourUTC: 12,
      forecast: '0.2% MoM / 2.9% YoY',
      previous: '2.9% YoY',
      marketImplication: 'Primary inflation gauge monitored by the Federal Reserve.',
      goldImplication: 'Lower CPI weakens DXY and drives gold up. Hot inflation spikes bond yields and pressures gold.',
      traderAction: 'Strict 15-minute pre/post release blackout. Wait for initial 15M candle close before taking setups.',
    },
    {
      title: 'US Non-Farm Payrolls (NFP) & Unemployment Rate',
      country: 'USA 🇺🇸',
      currency: 'USD',
      impact: 'HIGH' as MacroImpact,
      category: 'Employment',
      offsetDays: 4,
      hourUTC: 12,
      forecast: '165K new jobs / 4.1% Unemployment',
      previous: '172K new jobs',
      marketImplication: 'Key driver of economic growth and labor market tightness.',
      goldImplication: 'Weak jobs data boosts gold safe-haven and rate cut expectations. Strong jobs data strengthens USD.',
      traderAction: 'Expect heavy spread widening (10-25 pips on gold). No market orders during the 12:30 UTC release.',
    },
    {
      title: 'US Retail Sales (MoM)',
      country: 'USA 🇺🇸',
      currency: 'USD',
      impact: 'MEDIUM' as MacroImpact,
      category: 'Economic Growth',
      offsetDays: 5,
      hourUTC: 12,
      forecast: '0.3% MoM',
      previous: '0.1%',
      marketImplication: 'Measures consumer spending resilience (~70% of US economy).',
      goldImplication: 'Secondary catalyst for USD direction.',
      traderAction: 'Standard risk sizing. Watch 15M structure for confirmation.',
    },
    {
      title: 'ECB Monetary Policy Statement & Rate Decision',
      country: 'Eurozone 🇪🇺',
      currency: 'EUR',
      impact: 'MEDIUM' as MacroImpact,
      category: 'Central Bank',
      offsetDays: 6,
      hourUTC: 12,
      forecast: 'Refinancing rate 3.75%',
      previous: '3.75%',
      marketImplication: 'Direct influence on EUR/USD, indirectly driving the US Dollar Index (DXY).',
      goldImplication: 'Stronger Euro softens DXY, giving subtle tailwinds to XAU/USD.',
      traderAction: 'Monitor DXY reaction at European close.',
    },
  ];

  getCalendarState(referenceTime: number = Date.now()): MacroCalendarState {
    const now = new Date(referenceTime);
    const activeEvents: MacroEventItem[] = [];
    let minHoursToHighImpact = 999;
    let isBlackoutActive = false;

    for (let i = 0; i < this.baseEvents.length; i++) {
      const def = this.baseEvents[i];
      const eventDate = new Date(now);
      eventDate.setUTCDate(eventDate.getUTCDate() + def.offsetDays);
      eventDate.setUTCHours(def.hourUTC, 30, 0, 0);

      const diffMs = eventDate.getTime() - referenceTime;
      const hoursRemaining = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

      if (hoursRemaining > -2) { // Show events up to 2 hours past
        if (def.impact === 'HIGH' && hoursRemaining > 0 && hoursRemaining < minHoursToHighImpact) {
          minHoursToHighImpact = hoursRemaining;
        }

        // Blackout check: within 15 mins before to 15 mins after
        if (def.impact === 'HIGH' && Math.abs(diffMs) <= 15 * 60 * 1000) {
          isBlackoutActive = true;
        }

        let countdownBadge = '';
        if (hoursRemaining <= 0) {
          countdownBadge = 'JUST RELEASED';
        } else if (hoursRemaining < 2) {
          countdownBadge = `In ${Math.round(hoursRemaining * 60)} mins`;
        } else if (hoursRemaining < 24) {
          countdownBadge = `In ${Math.round(hoursRemaining)} hrs (TODAY)`;
        } else {
          countdownBadge = `In ${Math.floor(hoursRemaining / 24)}d ${Math.round(hoursRemaining % 24)}h`;
        }

        activeEvents.push({
          id: `macro-${i + 1}`,
          title: def.title,
          currency: def.currency,
          country: def.country,
          impact: def.impact,
          category: def.category,
          timestamp: eventDate.getTime(),
          dateTimeStr: eventDate.toUTCString(),
          hoursRemaining,
          countdownBadge,
          forecast: def.forecast,
          previous: def.previous,
          marketImplication: def.marketImplication,
          goldImplication: def.goldImplication,
          traderAction: def.traderAction,
        });
      }
    }

    let eventRiskScore = 20;
    let riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL' = 'LOW';
    let tacticalRecommendation = 'No immediate high-impact catalysts within 72 hours. Technical setups, SMC structure, and supply/demand dominate.';

    if (isBlackoutActive || minHoursToHighImpact <= 0.5) {
      eventRiskScore = 95;
      riskLevel = 'CRITICAL';
      tacticalRecommendation = 'HIGH-IMPACT EVENT BLACKOUT ACTIVE. Trading strictly paused. Wait for release and 15M candle confirmation before entering.';
    } else if (minHoursToHighImpact <= 24) {
      eventRiskScore = 80;
      riskLevel = 'CRITICAL';
      tacticalRecommendation = 'High-impact USD catalyst within 24 hours. Reduce risk to 0.5% per trade. Avoid holding tight breakout orders through release.';
    } else if (minHoursToHighImpact <= 48) {
      eventRiskScore = 60;
      riskLevel = 'ELEVATED';
      tacticalRecommendation = 'High-impact USD catalyst within 48 hours. Standard execution permitted, maintain disciplined stop-loss placement.';
    } else if (minHoursToHighImpact <= 72) {
      eventRiskScore = 40;
      riskLevel = 'MODERATE';
      tacticalRecommendation = 'Moderate event awareness. Normal trading parameters active.';
    }

    return {
      eventsCount: activeEvents.length,
      highImpactCount: activeEvents.filter(e => e.impact === 'HIGH').length,
      eventRiskScore,
      riskLevel,
      isBlackoutActive,
      minHoursToHighImpact: minHoursToHighImpact < 900 ? minHoursToHighImpact : null,
      tacticalRecommendation,
      events: activeEvents,
    };
  }
}

export const macroCalendar = new MacroCalendarEngine();
