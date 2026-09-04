import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCurrentRiverRace, getClanMembers } from '@/lib/cr-api';
import { getLiveWar, saveLiveWar, saveWarSnapshot, getMembers, saveMembers } from '@/lib/db';
import { buildWarSnapshot } from '@/lib/war-utils';

// Browser-initiated sync (uses session cookie instead of CRON_SECRET)
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Solo gli admin possono sincronizzare manualmente' }, { status: 403 });
  }

  // Reuse the same logic as /api/sync
  const syncUrl = new URL('/api/sync', request.url);
  const syncReq = new Request(syncUrl.toString(), {
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
    }
  });
  return fetch(syncReq);
}
