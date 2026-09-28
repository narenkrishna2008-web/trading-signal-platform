import { Candle } from '../types/market';
import { StrategyConfig, BiasAssessment, DirectionalBias } from '../types/strategy';
import { detectSwingPoints } from './swing-detection';
import { detectStructure } from './market-structure';

export function assessBias(candles4H: Candle[], config: StrategyConfig): BiasAssessment {
  const closedCandles = candles4H.filter(c => c.isClosed);
  const swings = detectSwingPoints(closedCandles, config.swingDetection.leftBars, config.swingDetection.rightBars);
  const structureEvents = detectStructure(swings);

  let bias: DirectionalBias = 'NEUTRAL';
  let confidence = 50;
  const reasons: string[] = [];

  const lastSwingHigh = swings.filter(s => s.type === 'SWING_HIGH').pop() || null;
  const lastSwingLow = swings.filter(s => s.type === 'SWING_LOW').pop() || null;
  const currentTimestamp = closedCandles[closedCandles.length - 1]?.timestamp || 0;

  // 1. Primary Evaluation: Confirmed Swing Structure
  if (structureEvents.length > 0) {
    const lastEvent = structureEvents[structureEvents.length - 1];

    if (lastEvent.structureType === 'HH' || lastEvent.structureType === 'HL') {
      bias = 'BULLISH';
      confidence = lastEvent.structureType === 'HH' ? 80 : 65;
      reasons.push(`4H structure confirmed ${lastEvent.structureType} (${lastEvent.type})`);
    } else if (lastEvent.structureType === 'LL' || lastEvent.structureType === 'LH') {
      bias = 'BEARISH';
      confidence = lastEvent.structureType === 'LL' ? 80 : 65;
      reasons.push(`4H structure confirmed ${lastEvent.structureType} (${lastEvent.type})`);
    }

    if (lastEvent.type === 'CHOCH') {
      reasons.push('Recent 4H Change of Character detected');
      confidence = Math.min(confidence + 10, 90);
    }

    return {
      bias,
      confidence,
      reasons,
      structureEvents,
      lastSwingHigh,
      lastSwingLow,
      timestamp: currentTimestamp,
    };
  }

  // 2. Secondary Evaluation: Macro Candle Slope (e.g. strong trending phase without completed fractals)
  if (closedCandles.length >= 20) {
    const startPrice = closedCandles[0].close;
    const endPrice = closedCandles[closedCandles.length - 1].close;
    const priceChangePct = ((endPrice - startPrice) / startPrice) * 100;

    // Fast 10-period and 20-period moving average
    const recentCloses = closedCandles.slice(-20).map(c => c.close);
    const sma20 = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
    const sma10 = recentCloses.slice(-10).reduce((a, b) => a + b, 0) / 10;

    if (endPrice > sma20 && sma10 > sma20 && priceChangePct > 0.5) {
      bias = 'BULLISH';
      confidence = 70;
      reasons.push('4H trending price action holding consistently above 20 SMA with positive momentum');
    } else if (endPrice < sma20 && sma10 < sma20 && priceChangePct < -0.5) {
      bias = 'BEARISH';
      confidence = 70;
      reasons.push('4H trending price action holding consistently below 20 SMA with negative momentum');
    } else {
      bias = 'NEUTRAL';
      confidence = 40;
      reasons.push('4H structure consolidating within compression range');
    }
  } else {
    reasons.push('Insufficient 4H candle depth for structural trend assessment');
  }

  return {
    bias,
    confidence,
    reasons,
    structureEvents,
    lastSwingHigh,
    lastSwingLow,
    timestamp: currentTimestamp,
  };
}
