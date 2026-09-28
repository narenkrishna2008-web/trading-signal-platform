import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const signal = await db.signalRecord.findUnique({
      where: { id },
      include: {
        instrument: true,
        journalEntry: true
      }
    });

    if (!signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      );
    }

    const formattedSignal = {
      ...signal,
      reasons: JSON.parse(signal.reasons),
      warnings: JSON.parse(signal.warnings)
    };

    return NextResponse.json(formattedSignal);
  } catch (error) {
    console.error('Error fetching signal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
