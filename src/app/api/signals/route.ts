import { NextRequest, NextResponse } from 'next/server';
import { signalStore } from '@/lib/engine/signal-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const symbol = searchParams.get('symbol');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    // 1. Try to read from in-memory / live store first (fastest, guaranteed working in serverless)
    let liveSignals = signalStore.getSignals(limit);

    if (symbol && symbol !== 'ALL') {
      liveSignals = liveSignals.filter(s => s.symbol === symbol);
    }
    if (status && status !== 'ALL') {
      liveSignals = liveSignals.filter(s => s.status === status);
    }

    if (liveSignals && liveSignals.length > 0) {
      return NextResponse.json(liveSignals);
    }

    // 2. Fallback to Prisma DB if available
    try {
      const { db } = await import('@/lib/db');
      const whereClause: any = {};
      if (status) whereClause.status = status;

      const signals = await db.signalRecord.findMany({
        where: whereClause,
        include: { instrument: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      if (signals && signals.length > 0) {
        const formatted = signals.map(s => ({
          ...s,
          reasons: typeof s.reasons === 'string' ? JSON.parse(s.reasons) : s.reasons,
          warnings: typeof s.warnings === 'string' ? JSON.parse(s.warnings) : s.warnings,
        }));
        return NextResponse.json(formatted);
      }
    } catch {
      // Prisma error in serverless environment handled gracefully
    }

    return NextResponse.json(liveSignals);
  } catch (error) {
    console.error('Error in /api/signals:', error);
    // Return live store signals even on unexpected error
    return NextResponse.json(signalStore.getSignals(limit));
  }
}
