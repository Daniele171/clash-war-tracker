import { NextResponse } from 'next/server';
import { getLiveWar } from '@/lib/db';

export async function GET() {
  try {
    const liveWar = await getLiveWar();
    return NextResponse.json(liveWar || { status: 'No active war' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
