import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Public sync — any authenticated user can trigger a silent data refresh
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  try {
    const syncUrl = new URL('/api/sync', request.url);
    const syncReq = new Request(syncUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      }
    });
    const res = await fetch(syncReq);
    const data = await res.json();
    // Return a simpler response — just whether there was updated data
    return NextResponse.json({
      ok: true,
      updated: data.success === true,
      battleDay: data.battleDay,
    });
  } catch {
    return NextResponse.json({ ok: false, updated: false });
  }
}
