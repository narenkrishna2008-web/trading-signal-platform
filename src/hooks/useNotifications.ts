'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SignalResult, SignalStatus } from '@/lib/types/strategy';

/**
 * Hook to manage sound effects (via Web Audio API) and browser notifications
 * for confirmed trading signals.
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const prevSignalStatusRef = useRef<Record<string, SignalStatus>>({});

  // Initialize permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request browser permission
  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        return res === 'granted';
      } catch (err) {
        console.warn('Failed to request notification permission:', err);
      }
    }
    return false;
  }, []);

  // Web Audio synthesizer tone generator (no external audio files required)
  const playSignalSound = useCallback((direction: 'BUY' | 'SELL') => {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (direction === 'BUY') {
        // Bullish double ascending chime (587Hz D5 -> 880Hz A5)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.15);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);

        // Second harmonic pulse
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.0, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3);
        gain2.gain.setValueAtTime(0.001, now + 0.15);
        gain2.gain.linearRampToValueAtTime(0.2, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.45);
      } else {
        // Bearish double descending chime (880Hz A5 -> 440Hz A4)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880.0, now);
        osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(587.33, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(440.0, now + 0.3);
        gain2.gain.setValueAtTime(0.001, now + 0.15);
        gain2.gain.linearRampToValueAtTime(0.25, now + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.45);
      }
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  }, [soundEnabled]);

  // Check signal transitions and trigger alert only on new CONFIRMED signals
  const checkAndNotifySignal = useCallback((signal: SignalResult | null | undefined, timeframe: string) => {
    if (!signal) return;

    const key = `${signal.symbol}-${timeframe}`;
    const prevStatus = prevSignalStatusRef.current[key];
    const currentStatus = signal.status;
    prevSignalStatusRef.current[key] = currentStatus;

    // Only fire if transitioning into an active trade signal
    const isNowActive = currentStatus === 'BUY' || currentStatus === 'STRONG_BUY' || currentStatus === 'SELL' || currentStatus === 'STRONG_SELL';
    const wasActive = prevStatus === 'BUY' || prevStatus === 'STRONG_BUY' || prevStatus === 'SELL' || prevStatus === 'STRONG_SELL';

    if (isNowActive && !wasActive) {
      const direction = currentStatus.includes('BUY') ? 'BUY' : 'SELL';
      playSignalSound(direction);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const title = `🚨 ${direction} CONFIRMED: ${signal.symbol} (${timeframe})`;
        const body = `Entry: $${signal.entry?.toFixed(2) || 'Market'} | SL: $${signal.stopLoss?.toFixed(2)} | Confluence: ${signal.confidence}%`;
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: `${signal.symbol}-${timeframe}-${Date.now()}`,
          });
        } catch {
          // ignore notification error on mobile browsers
        }
      }
    }
  }, [playSignalSound]);

  return {
    permission,
    requestPermission,
    soundEnabled,
    setSoundEnabled,
    playSignalSound,
    checkAndNotifySignal,
  };
}
