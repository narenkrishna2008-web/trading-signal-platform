import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerManager } from '@/lib/providers/provider-manager';

export async function GET() {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    subsystems: {
      database: 'UNKNOWN',
      providers: [] as any[]
    }
  };

  try {
    // Check DB
    await db.$queryRaw`SELECT 1`;
    health.subsystems.database = 'OK';
  } catch (error) {
    health.subsystems.database = 'ERROR';
    health.status = 'DEGRADED';
  }

  try {
    // Check Providers
    health.subsystems.providers = providerManager.getHealthStatus();
    if (health.subsystems.providers.every(p => p.status === 'OFFLINE' || p.status === 'STALE')) {
      if (health.status === 'OK') health.status = 'DEGRADED';
    }
  } catch (error) {
    health.status = 'ERROR';
  }

  return NextResponse.json(health, { 
    status: health.status === 'ERROR' ? 503 : 200 
  });
}
