import { MarketDataProvider, Quote, Candle, Timeframe, ProviderHealth, TIMEFRAME_MINUTES } from '../types/market';

export class DemoDataProvider implements MarketDataProvider {
  readonly name = 'DEMO';
  readonly priority = 99; // Fallback provider
  
  private currentPrice = 2650.00;
  private isInitialized = false;
  private quoteSubscribers: Map<string, Set<(quote: Quote) => void>> = new Map();
  private barSubscribers: Map<string, Map<Timeframe, Set<(candle: Candle) => void>>> = new Map();
  private quoteIntervals: Map<string, NodeJS.Timeout> = new Map();
  private barIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  private lastQuoteTimestamp: number | null = null;
  private lastCandleTimestamp: number | null = null;

  async initialize(): Promise<void> {
    this.isInitialized = true;
    return Promise.resolve();
  }

  async dispose(): Promise<void> {
    for (const [, interval] of this.quoteIntervals) {
      clearInterval(interval);
    }
    this.quoteIntervals.clear();
    
    for (const [, interval] of this.barIntervals) {
      clearInterval(interval);
    }
    this.barIntervals.clear();
    
    this.quoteSubscribers.clear();
    this.barSubscribers.clear();
    this.isInitialized = false;
  }

  async getHistoricalBars(
    symbol: string,
    timeframe: Timeframe,
    from: number,
    to: number,
    limit?: number
  ): Promise<Candle[]> {
    if (!this.supportsSymbol(symbol)) return [];
    
    const bars: Candle[] = [];
    const intervalMs = TIMEFRAME_MINUTES[timeframe] * 60 * 1000;
    
    // Normalize 'to' to the nearest interval
    let currentTimestamp = Math.floor(to / intervalMs) * intervalMs;
    let price = this.currentPrice;
    
    const count = limit || Math.ceil((to - from) / intervalMs);
    const actualCount = Math.min(count, 5000); // Sanity limit
    
    for (let i = 0; i < actualCount; i++) {
      if (currentTimestamp < from) break;
      
      const isUp = Math.random() > 0.45; // Slight bullish bias for gold
      const move = Math.random() * 5.0;
      const open = price;
      const close = isUp ? price + move : price - move;
      const high = Math.max(open, close) + Math.random() * 2.0;
      const low = Math.min(open, close) - Math.random() * 2.0;
      
      bars.unshift({
        symbol,
        timeframe,
        timestamp: currentTimestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000) + 100,
        source: this.name,
        isClosed: true
      });
      
      price = open; // Step back for previous candle
      currentTimestamp -= intervalMs;
    }
    
    return bars;
  }

  async getLatestQuote(symbol: string): Promise<Quote | null> {
    if (!this.supportsSymbol(symbol)) return null;
    return this.generateQuote(symbol);
  }

  subscribeToQuotes(
    symbol: string,
    callback: (quote: Quote) => void
  ): () => void {
    if (!this.quoteSubscribers.has(symbol)) {
      this.quoteSubscribers.set(symbol, new Set());
      this.startQuoteGeneration(symbol);
    }
    
    const subs = this.quoteSubscribers.get(symbol)!;
    subs.add(callback);
    
    return () => {
      subs.delete(callback);
      if (subs.size === 0) {
        this.quoteSubscribers.delete(symbol);
        const interval = this.quoteIntervals.get(symbol);
        if (interval) {
          clearInterval(interval);
          this.quoteIntervals.delete(symbol);
        }
      }
    };
  }

  subscribeToBars(
    symbol: string,
    timeframe: Timeframe,
    callback: (candle: Candle) => void
  ): () => void {
    if (!this.barSubscribers.has(symbol)) {
      this.barSubscribers.set(symbol, new Map());
    }
    
    const symbolMap = this.barSubscribers.get(symbol)!;
    if (!symbolMap.has(timeframe)) {
      symbolMap.set(timeframe, new Set());
      this.startBarGeneration(symbol, timeframe);
    }
    
    const subs = symbolMap.get(timeframe)!;
    subs.add(callback);
    
    return () => {
      subs.delete(callback);
      if (subs.size === 0) {
        symbolMap.delete(timeframe);
        const intervalKey = `${symbol}_${timeframe}`;
        const interval = this.barIntervals.get(intervalKey);
        if (interval) {
          clearInterval(interval);
          this.barIntervals.delete(intervalKey);
        }
      }
    };
  }

  getProviderStatus(): ProviderHealth {
    return {
      provider: this.name,
      status: this.isInitialized ? 'LIVE' : 'OFFLINE',
      lastTick: this.lastQuoteTimestamp,
      lastCandle: this.lastCandleTimestamp,
      latencyMs: 10, // Simulated low latency
      historicalDataAvailable: true,
      webSocketConnected: true,
    };
  }

  supportsSymbol(symbol: string): boolean {
    return symbol === 'XAU/USD' || symbol === 'BTC/USD' || symbol === 'ETH/USD';
  }

  private generateQuote(symbol: string): Quote {
    const volatility = symbol === 'XAU/USD' ? 0.5 : 5.0;
    const change = (Math.random() - 0.5) * volatility;
    this.currentPrice += change;
    
    // Keep price within realistic bounds
    if (this.currentPrice < 2000) this.currentPrice = 2000;
    if (this.currentPrice > 3000) this.currentPrice = 3000;

    const spread = symbol === 'XAU/USD' ? 0.2 : 1.0;
    const mid = this.currentPrice;
    
    this.lastQuoteTimestamp = Date.now();

    return {
      symbol,
      bid: mid - (spread / 2),
      ask: mid + (spread / 2),
      mid,
      spread,
      timestamp: this.lastQuoteTimestamp,
      source: this.name
    };
  }

  private startQuoteGeneration(symbol: string) {
    const interval = setInterval(() => {
      const quote = this.generateQuote(symbol);
      const subs = this.quoteSubscribers.get(symbol);
      if (subs) {
        subs.forEach(cb => cb(quote));
      }
    }, 1500); // 1.5s updates
    this.quoteIntervals.set(symbol, interval);
  }

  private startBarGeneration(symbol: string, timeframe: Timeframe) {
    // In a real scenario, this would aggregate ticks. 
    // For demo, we just emit a closed bar on an interval.
    let currentBar = this.createEmptyBar(symbol, timeframe);
    
    // Emit updates quickly for demo purposes (not realistic timeframes)
    // E.g. every 5 seconds we close a "1M" bar in demo mode
    const demoIntervalMs = 5000; 
    
    const interval = setInterval(() => {
      currentBar.isClosed = true;
      currentBar.close = this.currentPrice;
      
      this.lastCandleTimestamp = Date.now();
      
      const subs = this.barSubscribers.get(symbol)?.get(timeframe);
      if (subs) {
        subs.forEach(cb => cb({ ...currentBar }));
      }
      
      // Start next bar
      currentBar = this.createEmptyBar(symbol, timeframe);
    }, demoIntervalMs);
    
    this.barIntervals.set(`${symbol}_${timeframe}`, interval);
  }

  private createEmptyBar(symbol: string, timeframe: Timeframe): Candle {
    return {
      symbol,
      timeframe,
      timestamp: Date.now(),
      open: this.currentPrice,
      high: this.currentPrice,
      low: this.currentPrice,
      close: this.currentPrice,
      volume: 0,
      source: this.name,
      isClosed: false
    };
  }
}
