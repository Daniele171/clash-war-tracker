import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

// GET all users
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const adminAuthClient = createAdminClient()
  const { data, error } = await adminAuthClient.auth.admin.listUsers()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.user_metadata?.role || 'viewer',
    createdAt: u.created_at
  }))

  return NextResponse.json(users)
}

// POST create user
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  try {
    const { email, password, role } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 })
    }

    const adminAuthClient = createAdminClient()
    const { data, error } = await adminAuthClient.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: true, // auto-confirm
      user_metadata: { role: role || 'viewer' }
    })

    if (error) throw error

    return NextResponse.json({ success: true, user: data.user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// DELETE user
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  try {
    const { id } = await request.json()
    if (id === user.id) {
      return NextResponse.json({ error: 'Non puoi eliminare te stesso' }, { status: 400 })
    }

    const adminAuthClient = createAdminClient()
    const { error } = await adminAuthClient.auth.admin.deleteUser(id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
