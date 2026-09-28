import { MarketDataProvider, Quote, Candle, Timeframe, ProviderHealth, ProviderStatus } from '../types/market';
import { DemoDataProvider } from './demo-provider';
import { LiveMarketProvider } from './live-provider';

export class ProviderManager {
  private providers: MarketDataProvider[] = [];
  private activeProvider: MarketDataProvider | null = null;
  private fallbackProvider: MarketDataProvider;
  private liveProvider: MarketDataProvider;
  private isInitialized = false;

  private staleTimeoutMs = 30000; // 30 seconds without updates = stale

  constructor() {
    this.liveProvider = new LiveMarketProvider();
    this.fallbackProvider = new DemoDataProvider();

    // Live provider is priority 1, fallback demo is priority 99
    this.providers.push(this.liveProvider);
    this.providers.push(this.fallbackProvider);
    this.providers.sort((a, b) => a.priority - b.priority);

    // Default to live provider
    this.activeProvider = this.liveProvider;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    for (const provider of this.providers) {
      try {
        await provider.initialize();
      } catch (err) {
        console.warn(`[ProviderManager] Failed to init provider ${provider.name}:`, err);
      }
    }
    this.isInitialized = true;
    this.evaluateActiveProvider();
  }

  async addProvider(provider: MarketDataProvider): Promise<void> {
    await provider.initialize();
    this.providers.push(provider);
    this.providers.sort((a, b) => a.priority - b.priority);
    this.evaluateActiveProvider();
  }

  private evaluateActiveProvider() {
    for (const provider of this.providers) {
      const status = provider.getProviderStatus();
      if (status.status === 'LIVE' || status.status === 'DEGRADED') {
        if (this.activeProvider !== provider) {
          console.log(`[ProviderManager] Switching active provider to ${provider.name}`);
          this.activeProvider = provider;
        }
        return;
      }
    }
    this.activeProvider = this.fallbackProvider;
  }

  async getHistoricalBars(
    symbol: string,
    timeframe: Timeframe,
    from: number,
    to: number,
    limit?: number
  ): Promise<Candle[]> {
    await this.initialize();
    if (!this.activeProvider) throw new Error('No active provider');

    try {
      const bars = await this.activeProvider.getHistoricalBars(symbol, timeframe, from, to, limit);
      if (bars && bars.length > 0) return bars;
      throw new Error('Empty bars returned');
    } catch (error) {
      console.warn(`[ProviderManager] Error fetching bars from ${this.activeProvider.name}, falling back to demo:`, error instanceof Error ? error.message : error);
      // Fallback
      return await this.fallbackProvider.getHistoricalBars(symbol, timeframe, from, to, limit);
    }
  }

  async getLatestQuote(symbol: string): Promise<Quote | null> {
    await this.initialize();
    if (!this.activeProvider) return null;
    try {
      const quote = await this.activeProvider.getLatestQuote(symbol);
      if (quote && quote.mid > 0) return quote;
      throw new Error('Empty quote returned');
    } catch (error) {
      console.warn(`[ProviderManager] Error fetching quote from ${this.activeProvider.name}, falling back to demo:`, error instanceof Error ? error.message : error);
      return await this.fallbackProvider.getLatestQuote(symbol);
    }
  }

  subscribeToQuotes(symbol: string, callback: (quote: Quote) => void): () => void {
    if (!this.activeProvider) return () => {};
    return this.activeProvider.subscribeToQuotes(symbol, callback);
  }

  subscribeToBars(symbol: string, timeframe: Timeframe, callback: (candle: Candle) => void): () => void {
    if (!this.activeProvider) return () => {};
    return this.activeProvider.subscribeToBars(symbol, timeframe, callback);
  }

  getHealthStatus(): ProviderHealth[] {
    return this.providers.map(p => {
      const health = p.getProviderStatus();
      const now = Date.now();

      if (health.status === 'LIVE' && health.lastTick && (now - health.lastTick > this.staleTimeoutMs)) {
        health.status = 'STALE';
      }
      return health;
    });
  }

  getActiveProviderName(): string {
    return this.activeProvider?.name || 'NONE';
  }
}

// Export singleton instance
export const providerManager = new ProviderManager();
