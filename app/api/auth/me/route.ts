import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function emailToUsername(email: string): string {
  if (email.endsWith('@clan.local')) {
    return email.replace('@clan.local', '');
  }
  // For legacy full-email accounts, use the part before @
  return email.split('@')[0];
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  const username = user.user_metadata?.username || emailToUsername(user.email || '');

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username,
    role: user.user_metadata?.role || 'viewer'
  })
}
