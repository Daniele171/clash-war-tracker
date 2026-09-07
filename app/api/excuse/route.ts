import { NextResponse } from 'next/server';
import { setExcuse, removeExcuse, getJson } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo gli admin possono giustificare' }, { status: 403 });
    }

    const isMaster = user.email === 'grazioso.daniele7@gmail.com';
    const perms = (await getJson('cwt:settings:permissions')) || {};
    if (!isMaster && perms.adminCanExcuse === false) {
      return NextResponse.json({ error: 'Permesso negato dal Master Admin' }, { status: 403 })
    }

    const { tag, reason } = await request.json();
    if (!tag) {
      return NextResponse.json({ error: 'Tag mancante' }, { status: 400 });
    }

    await setExcuse(tag, reason || 'Giustificato');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo gli admin possono gestire le giustificazioni' }, { status: 403 });
    }

    const isMaster = user.email === 'grazioso.daniele7@gmail.com';
    const perms = (await getJson('cwt:settings:permissions')) || {};
    if (!isMaster && perms.adminCanExcuse === false) {
      return NextResponse.json({ error: 'Permesso negato dal Master Admin' }, { status: 403 })
    }

    const { tag } = await request.json();
    if (!tag) {
      return NextResponse.json({ error: 'Tag mancante' }, { status: 400 });
    }

    await removeExcuse(tag);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
