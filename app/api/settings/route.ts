import { NextResponse } from 'next/server';
import { getJson, setJson } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  if (user.email !== 'grazioso.daniele7@gmail.com') {
    return NextResponse.json({ error: 'Solo il Master Admin può accedere' }, { status: 403 });
  }

  try {
    const tgSettings = await getJson('cwt:settings:telegram') || {};
    return NextResponse.json(tgSettings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'admin' || user.email !== 'grazioso.daniele7@gmail.com') {
    return NextResponse.json({ error: 'Solo il Master Admin può modificare le impostazioni' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { token, chatId } = body;

    const tgSettings = { token, chatId };
    await setJson('cwt:settings:telegram', tgSettings);

    return NextResponse.json({ success: true, settings: tgSettings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
