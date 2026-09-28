import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('Received test webhook:', payload);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received successfully',
      receivedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
