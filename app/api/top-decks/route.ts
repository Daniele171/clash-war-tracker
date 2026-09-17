import { apiUnauthorized, handleApiError, apiSuccess } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth';
import { getPlayerBattleLog } from '@/lib/cr-api';
import { getLiveWar, getClanStats, getJson, setJson } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.user) {
      return apiUnauthorized('Non autorizzato');
    }

    const CACHE_KEY = 'cwt:top-decks:cache';
    const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

    const cached = await getJson(CACHE_KEY);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return apiSuccess(cached.data);
    }
    const liveWar = await getLiveWar();
    const stats = await getClanStats();

    // 1. Determine top players to inspect
    let topTags: string[] = [];
    
    if (stats && Object.keys(stats).length > 0) {
      // Sort by perfect days and total decks used
      const sorted = Object.values(stats)
        .sort((a, b) => b.perfectDays - a.perfectDays || b.totalDecksUsed - a.totalDecksUsed)
        .slice(0, 10);
      topTags = sorted.map(s => s.tag);
    } else if (liveWar) {
      // Fallback: top medals in current war
      const sorted = [...liveWar.participants]
        .sort((a, b) => b.medals - a.medals)
        .slice(0, 10);
      topTags = sorted.map(p => p.tag);
    }

    if (topTags.length === 0) {
      return apiSuccess({ decks: [] });
    }

    // 2. Fetch battle logs
    const validDecks = [];
    const deckHashes = new Set<string>();

    for (const tag of topTags) {
      try {
        const battleLog = await getPlayerBattleLog(tag);
        if (!Array.isArray(battleLog)) continue;

        for (const battle of battleLog) {
          if (battle.type === 'riverRacePvP' || battle.type === 'riverRaceDuel') {
            const team = battle.team && battle.team[0];
            const opponent = battle.opponent && battle.opponent[0];
            
            if (team && opponent && team.crowns > opponent.crowns) { // Win!
              if (team.cards && team.cards.length === 8) {
                // Generate a simple hash to avoid identical decks
                const hash = team.cards.map((c: any) => c.id).sort().join(',');
                if (!deckHashes.has(hash)) {
                  deckHashes.add(hash);
                  validDecks.push({
                    player: team.name,
                    tag: tag,
                    time: battle.battleTime,
                    cards: team.cards.map((c: any) => ({
                      id: c.id,
                      name: c.name,
                      iconUrls: c.iconUrls
                    }))
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`Failed to fetch battlelog for ${tag}`, err);
      }
    }

    // Return the top 6 unique winning decks
    const finalDecks = validDecks.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
    const responseData = { decks: finalDecks, generatedAt: new Date().toISOString() };

    await setJson(CACHE_KEY, { ts: Date.now(), data: responseData });
    return apiSuccess(responseData);
  } catch (error) {
    return handleApiError(error);
  }
}
