import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { getCurrentRiverRace, getClanMembers } from '@/lib/cr-api';
import { getLiveWar, saveLiveWar, getJson, setJson } from '@/lib/db';
import { buildWarSnapshot } from '@/lib/war-utils';

function apiSuccess(data: any) {
  return NextResponse.json(data);
}

function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.user) {
      return apiError('Non autorizzato', 401);
    }

    // Rate limit: 90 seconds
    const last = await getJson('cwt:sync:lastpublic') || { ts: 0 };
    if (Date.now() - last.ts < 90_000) {
      return apiSuccess({ ok: true, skipped: true, reason: 'recent' });
    }

    const clanTag = process.env.CLAN_TAG;
    if (!clanTag) {
      return apiError('Clan tag non configurato');
    }

    const [race, members] = await Promise.all([
      getCurrentRiverRace(clanTag),
      getClanMembers(clanTag)
    ]);

    if (!race || !race.clan) {
      return apiError('Impossibile recuperare i dati della River Race');
    }

    const liveWar = await getLiveWar();
    let existingExcuses: Record<string, string> = {};
    if (liveWar && liveWar.participants) {
      liveWar.participants.forEach((p: any) => {
        if (p.status === 'excused' && p.excuseReason) {
          existingExcuses[p.tag] = p.excuseReason;
        }
      });
    }
    
    const freshSnapshot = buildWarSnapshot(race, members?.items || [], false, existingExcuses);
    await saveLiveWar(freshSnapshot);
    
    // Set rate limit ONLY on success
    await setJson('cwt:sync:lastpublic', { ts: Date.now() });

    return apiSuccess({ ok: true, message: 'Sync pubblico completato' });
  } catch (error: any) {
    console.error('Public sync error:', error);
    return apiError(error.message);
  }
}
