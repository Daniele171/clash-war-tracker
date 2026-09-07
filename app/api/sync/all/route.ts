import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getJson } from '@/lib/db';

// Public sync — any authenticated user can trigger a silent data refresh
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const isMaster = user.email === 'grazioso.daniele7@gmail.com';
  const isAdmin = user.user_metadata?.role === 'admin';
  const perms = (await getJson('cwt:settings:permissions')) || {};
  const canSync = isMaster || (isAdmin && perms.adminCanForceSync !== false);

  if (!canSync) {
    return NextResponse.json({ error: 'Non hai i permessi per forzare la sincronizzazione' }, { status: 403 });
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
