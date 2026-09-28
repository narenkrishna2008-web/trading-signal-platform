import { NextRequest, NextResponse } from 'next/server';
import { providerManager } from '@/lib/providers/provider-manager';
import { Timeframe } from '@/lib/types/market';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'XAU/USD';
  const timeframe = (searchParams.get('timeframe') || '15M') as Timeframe;
  
  const to = searchParams.get('to') 
    ? parseInt(searchParams.get('to')!) 
    : Date.now();
    
  const from = searchParams.get('from') 
    ? parseInt(searchParams.get('from')!) 
    : to - (24 * 60 * 60 * 1000); // Default 1 day lookback
    
  const limit = searchParams.get('limit') 
    ? parseInt(searchParams.get('limit')!) 
    : 100;

  try {
    await providerManager.initialize();
    
    const bars = await providerManager.getHistoricalBars(
      symbol,
      timeframe,
      from,
      to,
      limit
    );

    return NextResponse.json({
      symbol,
      timeframe,
      count: bars.length,
      data: bars
    });
  } catch (error) {
    console.error('Error fetching bars:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
