import { NextRequest, NextResponse } from 'next/server';
import { providerManager } from '@/lib/providers/provider-manager';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'XAU/USD';

  try {
    // Initialize provider if needed (in a real app, this would be done on server start)
    await providerManager.initialize();
    
    const quote = await providerManager.getLatestQuote(symbol);
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Failed to fetch quote or unsupported symbol' },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
