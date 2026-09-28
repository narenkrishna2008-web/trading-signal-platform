import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const settings = await db.appSetting.findMany();
    const formatted = settings.reduce((acc, cur) => {
      acc[cur.key] = JSON.parse(cur.value);
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const setting = await db.appSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) }
    });

    return NextResponse.json({ key: setting.key, value: JSON.parse(setting.value) });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
