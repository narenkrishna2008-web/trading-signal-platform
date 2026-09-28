/**
 * Market session engine.
 * Handles session identification, blackout windows, and session filtering.
 */

import { MarketSession, SESSION_DEFINITIONS } from '../types/market';
import { StrategyConfig, MacroEvent } from '../types/strategy';

/**
 * Determine the current market session from a UTC timestamp.
 */
export function getCurrentSession(timestampMs: number): MarketSession {
  const date = new Date(timestampMs);
  const hourUTC = date.getUTCHours();
  const minUTC = date.getUTCMinutes();
  const time = hourUTC + minUTC / 60;

  // Check overlap first (most specific)
  if (time >= 12 && time < 16) return 'OVERLAP_LONDON_NY';
  if (time >= 16 && time < 21) return 'NEW_YORK';
  if (time >= 7 && time < 12) return 'LONDON';
  if (time >= 0 && time < 8) return 'ASIA';

  return 'OFF_HOURS';
}

/**
 * Check if a session is in the allowed sessions list.
 */
export function isSessionAllowed(session: MarketSession, config: StrategyConfig): boolean {
  if (!config.session.enabled) return true;
  // OVERLAP_LONDON_NY counts as both London and New York
  if (session === 'OVERLAP_LONDON_NY') {
    return config.session.allowedSessions.includes('OVERLAP_LONDON_NY') ||
           config.session.allowedSessions.includes('LONDON') ||
           config.session.allowedSessions.includes('NEW_YORK');
  }
  return config.session.allowedSessions.includes(session);
}

/**
 * Check if current time is within a macro event blackout window.
 */
export function isInBlackout(timestampMs: number, events: MacroEvent[], config: StrategyConfig): boolean {
  if (!config.session.enabled) return false;

  for (const event of events) {
    if (event.impact !== 'HIGH') continue;
    const diffMins = (event.timestamp - timestampMs) / 60000;
    // Before event: diffMins > 0 (event in future)
    // After event: diffMins < 0 (event in past)
    if (diffMins >= -config.session.blackoutAfterEventMinutes && diffMins <= config.session.blackoutBeforeEventMinutes) {
      return true;
    }
  }

  return false;
}

/**
 * Get session time range for a given date in UTC.
 */
export function getSessionRange(session: MarketSession, date: Date): { start: number; end: number } {
  const def = SESSION_DEFINITIONS.find(s => s.name === session);
  if (!def) return { start: 0, end: 0 };

  const start = new Date(date);
  start.setUTCHours(def.startHourUTC, def.startMinuteUTC, 0, 0);

  const end = new Date(date);
  end.setUTCHours(def.endHourUTC, def.endMinuteUTC, 0, 0);

  return { start: start.getTime(), end: end.getTime() };
}

/**
 * Get display name for a session.
 */
export function getSessionDisplayName(session: MarketSession): string {
  const def = SESSION_DEFINITIONS.find(s => s.name === session);
  return def?.displayName ?? session;
}
