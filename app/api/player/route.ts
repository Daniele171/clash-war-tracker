import { requireAuth } from '@/lib/auth';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

const CR_API_URL = 'https://proxy.royaleapi.dev/v1';

async function fetchPlayer(tag: string) {
  const token = process.env.CR_API_KEY;
  if (!token) throw new Error('CR_API_KEY non configurata');
  const cleanTag = tag.startsWith('#') ? tag : '#' + tag;
  const encoded = encodeURIComponent(cleanTag.toUpperCase());
  const res = await fetch(`${CR_API_URL}/players/${encoded}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`CR API Errore: ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  try {
    await requireAuth();

    const url = new URL(request.url);
    const tag = url.searchParams.get('tag');
    if (!tag || !tag.trim()) {
      return apiError('Tag giocatore mancante o non valido', 400);
    }

    const player = await fetchPlayer(tag.trim());
    return apiSuccess({
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
  } catch (error) {
    return handleApiError(error);
  }
}
