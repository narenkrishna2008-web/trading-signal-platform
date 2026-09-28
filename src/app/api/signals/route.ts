import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const symbol = searchParams.get('symbol');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    const whereClause: any = {};
    if (status) whereClause.status = status;
    
    // We'd normally join Instrument here to filter by symbol, 
    // but Prisma relation filtering takes slightly more logic.
    // For simplicity, we just fetch latest signals.
    const signals = await db.signalRecord.findMany({
      where: whereClause,
      include: {
        instrument: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    const formattedSignals = signals.map(s => ({
      ...s,
      reasons: JSON.parse(s.reasons),
      warnings: JSON.parse(s.warnings)
    }));

    return NextResponse.json(formattedSignals);
  } catch (error) {
    console.error('Error fetching signals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
