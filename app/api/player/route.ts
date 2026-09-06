import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const CR_API_URL = 'https://proxy.royaleapi.dev/v1';

async function fetchPlayer(tag: string) {
  const token = process.env.CR_API_KEY;
  if (!token) throw new Error('CR_API_KEY not set');
  const cleanTag = tag.startsWith('#') ? tag : '#' + tag;
  const encoded = encodeURIComponent(cleanTag.toUpperCase());
  const res = await fetch(`${CR_API_URL}/players/${encoded}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CR API ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const url = new URL(request.url);
  const tag = url.searchParams.get('tag');
  if (!tag) return NextResponse.json({ error: 'Tag mancante' }, { status: 400 });

  try {
    const player = await fetchPlayer(tag);
    return NextResponse.json({
      tag: player.tag,
      name: player.name,
      expLevel: player.expLevel,
      trophies: player.trophies,
      bestTrophies: player.bestTrophies,
      arena: player.arena?.name || null,
      arenaId: player.arena?.id || null,
      role: player.role,
      donations: player.donations,
      donationsReceived: player.donationsReceived,
      warDayWins: player.warDayWins,
      clanWarTrophies: player.clanWarTrophies,
      cards: (player.cards || []).length,
      badges: (player.badges || []).length,
      starPoints: player.starPoints,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
