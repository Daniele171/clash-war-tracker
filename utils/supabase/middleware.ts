import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore /api routes completely to avoid Supabase auth overhead and middleware crashes
  if (pathname.startsWith('/api')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Force password change if needed
    if (user && user.user_metadata?.must_change_password && !pathname.startsWith('/change-password') && pathname !== '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/change-password'
      return NextResponse.redirect(url)
    }

    // Redirect away from login or change-password if already set up
    if (user && (pathname === '/login' || (pathname === '/change-password' && !user.user_metadata?.must_change_password))) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (e) {
    console.error('Middleware Supabase Error:', e)
    // Su errori transitori Supabase (es. rete lenta su PWA mobile), NON redirigere al login.
    // Il redirect causava il "double login": il cookie di sessione non era ancora propagato
    // al momento del primo refresh, Supabase dava errore, e il catch mandava al login.
    // Lasciamo passare la richiesta: se la sessione non c'è davvero, il prossimo
    // tentativo del middleware la catturerà correttamente.
    return supabaseResponse
  }
}
