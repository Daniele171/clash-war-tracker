import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    const keys = await kv.keys('*');
    const liveWar = await kv.get('cwt:war:live');
    return NextResponse.json({ keys, liveWar, typeofLiveWar: typeof liveWar });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
