import { RiskConfig, TakeProfitLevel, SignalResult } from '../types/strategy';
import { InstrumentConfig } from '../types/market';

export function calculatePositionSize(riskConfig: RiskConfig, entry: number, stopLoss: number, instrumentConfig: any): number {
  if (entry === stopLoss) return 0;
  
  const riskAmount = riskConfig.accountSize * (riskConfig.riskPerTradePercent / 100);
  const stopDistance = Math.abs(entry - stopLoss);
  
  // Calculate raw size based on simple distance
  const positionSize = riskAmount / stopDistance;
  
  return positionSize;
}

export function calculateRiskReward(entry: number, stopLoss: number, targets: TakeProfitLevel[]): number {
  if (targets.length === 0 || entry === stopLoss) return 0;
  
  const risk = Math.abs(entry - stopLoss);
  
  // Assuming equal split among targets for RR calculation
  let totalReward = 0;
  for (const tp of targets) {
    totalReward += Math.abs(tp.price - entry);
  }
  const avgReward = totalReward / targets.length;
  
  return avgReward / risk;
}

export function checkDailyLimits(signals: SignalResult[], riskConfig: RiskConfig): boolean {
  // Simplified daily limit check
  const activeSignals = signals.filter(s => ['ACTIVE', 'PARTIAL', 'CONFIRMED'].includes(s.lifecycle));
  if (activeSignals.length >= riskConfig.maxConcurrentSignals) {
    return false;
  }
  return true;
}
