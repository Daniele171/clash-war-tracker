import { NextResponse } from 'next/server';
import { getJson, setJson } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Default permissions if not set
    const defaultPermissions = {
      adminCanCreateUser: false,
      adminCanDeleteUser: false,
      adminCanExcuse: true,
      adminCanForceSync: true,
      adminCanChangeRole: false
    };

    const perms = await getJson('cwt:settings:permissions');
    
    // Merge with defaults to ensure all keys exist
    const finalPerms = { ...defaultPermissions, ...(perms || {}) };

    // If user is Master Admin, they override everything in the UI implicitly,
    // but the API still returns the current configured state so they can edit it.
    // We will append a flag `isMaster` for the frontend's convenience.
    const isMaster = user?.email === 'grazioso.daniele7@gmail.com';

    return NextResponse.json({ permissions: finalPerms, isMaster });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== 'grazioso.daniele7@gmail.com') {
    return NextResponse.json({ error: 'Solo il Master Admin può modificare i permessi' }, { status: 403 });
  }

  try {
    const body = await request.json();
    await setJson('cwt:settings:permissions', body);
    return NextResponse.json({ success: true, permissions: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
