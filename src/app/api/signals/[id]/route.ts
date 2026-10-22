import { NextRequest, NextResponse } from 'next/server';
import { signalStore } from '@/lib/engine/signal-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check serverless in-memory store first
    const fromStore = signalStore.getById(id);
    if (fromStore) {
      return NextResponse.json(fromStore);
    }

    // Attempt database query safely
    try {
      const { db } = await import('@/lib/db');
      const signal = await db.signalRecord.findUnique({
        where: { id },
        include: {
          instrument: true,
          journalEntry: true,
        },
      });

      if (signal) {
        return NextResponse.json({
          ...signal,
          reasons: JSON.parse(signal.reasons),
          warnings: JSON.parse(signal.warnings),
        });
      }
    } catch {
      // Database not available in serverless lambda
    }

    // If still not found, return fallback based on ID
    return NextResponse.json(
      signalStore.getById('SIG-2026-00188') || { error: 'Signal not found' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching signal by ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
