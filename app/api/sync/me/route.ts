import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Browser-initiated sync
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
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
