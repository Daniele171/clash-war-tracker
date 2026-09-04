import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ 
    hasRedis: !!process.env.REDIS_URL,
    hasKV: !!process.env.KV_REST_API_URL,
    redisUrlPrefix: process.env.REDIS_URL ? process.env.REDIS_URL.substring(0, 15) : null,
    hasSupercellKey: !!process.env.CLASH_ROYALE_API_KEY || !!process.env.CR_API_KEY
  });
}
