import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const entries = await db.journalEntryRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: { linkedSignal: true }
    });
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const entry = await db.journalEntryRecord.create({
      data: {
        symbol: body.symbol,
        direction: body.direction,
        setupType: body.setupType,
        entryPrice: body.entryPrice,
        stopLoss: body.stopLoss,
        takeProfit: body.takeProfit,
        result: body.result,
        pnl: body.pnl,
        notes: body.notes,
        emotionalState: body.emotionalState,
        ruleFollowingScore: body.ruleFollowingScore,
        mistakeCategory: body.mistakeCategory,
        linkedSignalId: body.linkedSignalId,
        screenshotUrl: body.screenshotUrl,
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
