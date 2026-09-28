import { SwingPoint, StructureEvent, StructureType, StructureBreakType, StructureLevel } from '../types/strategy';

export function detectStructure(swingPoints: SwingPoint[]): StructureEvent[] {
  const events: StructureEvent[] = [];
  
  let lastHigh: SwingPoint | null = null;
  let lastLow: SwingPoint | null = null;
  let currentTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

  for (const sp of swingPoints) {
    if (!sp.confirmed) continue;

    if (sp.type === 'SWING_HIGH') {
      if (lastHigh) {
        const isHH = sp.price > lastHigh.price;
        const structType: StructureType = isHH ? 'HH' : 'LH';
        
        let breakType: StructureBreakType = 'BOS';
        if (currentTrend === 'BEARISH' && isHH) {
          breakType = 'CHOCH';
          currentTrend = 'BULLISH';
        } else if (isHH) {
          breakType = 'BOS';
          currentTrend = 'BULLISH';
        } else {
          // Lower high
          if (currentTrend === 'NEUTRAL') currentTrend = 'BEARISH';
        }

        events.push({
          type: breakType,
          structureType: structType,
          level: 'EXTERNAL',
          direction: 'BULLISH',
          breakPrice: sp.price,
          referencePrice: lastHigh.price,
          timestamp: sp.timestamp,
          candleIndex: sp.candleIndex,
          confirmed: true,
        });
      } else {
        if (currentTrend === 'NEUTRAL') currentTrend = 'BULLISH';
      }
      lastHigh = sp;
    } else {
      // SWING_LOW
      if (lastLow) {
        const isLL = sp.price < lastLow.price;
        const structType: StructureType = isLL ? 'LL' : 'HL';
        
        let breakType: StructureBreakType = 'BOS';
        if (currentTrend === 'BULLISH' && isLL) {
          breakType = 'CHOCH';
          currentTrend = 'BEARISH';
        } else if (isLL) {
          breakType = 'BOS';
          currentTrend = 'BEARISH';
        } else {
          // Higher low
          if (currentTrend === 'NEUTRAL') currentTrend = 'BULLISH';
        }

        events.push({
          type: breakType,
          structureType: structType,
          level: 'EXTERNAL',
          direction: 'BEARISH',
          breakPrice: sp.price,
          referencePrice: lastLow.price,
          timestamp: sp.timestamp,
          candleIndex: sp.candleIndex,
          confirmed: true,
        });
      } else {
        if (currentTrend === 'NEUTRAL') currentTrend = 'BEARISH';
      }
      lastLow = sp;
    }
  }

  return events;
}
