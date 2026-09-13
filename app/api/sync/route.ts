import { getCurrentRiverRace, getClanMembers } from '@/lib/cr-api';
import { getLiveWar, saveLiveWar, saveWarSnapshot, getMembers, saveMembers, getClanStats, saveClanStats } from '@/lib/db';
import { buildWarSnapshot } from '@/lib/war-utils';
import { verifyCronSecret } from '@/lib/auth';
import { apiSuccess, apiUnauthorized, apiError, handleApiError } from '@/lib/api-response';

export async function GET(request: Request) {
  // 1. Verify cron secret (fail-closed)
  if (!verifyCronSecret(request)) {
    return apiUnauthorized('Richiesta non autorizzata: secret non valido o mancante');
  }

  const tag = process.env.CLAN_TAG;
  if (!tag) {
    return apiError('CLAN_TAG non configurato', 500);
  }

  try {
    // 2. Fetch Members & update
    const membersData = await getClanMembers(tag);
    const apiMembers = membersData.items || [];
    
    const dbMembers = await getMembers();
    const updatedMembers = apiMembers.map((am: any) => {
      const existing = dbMembers.find(m => m.tag === am.tag);
      return {
        tag: am.tag,
        name: am.name,
        role: am.role,
        active: true,
        joinedDate: existing?.joinedDate || new Date().toISOString()
      };
    });
    // Mark missing as inactive
    dbMembers.forEach(dbm => {
      if (!updatedMembers.find((um: any) => um.tag === dbm.tag)) {
        updatedMembers.push({ ...dbm, active: false });
      }
    });
    await saveMembers(updatedMembers);

    // 3. Fetch River Race
    const race = await getCurrentRiverRace(tag);
    if (!race || !race.clan) {
       return apiSuccess({ status: 'No active race data' });
    }

    // Preserve existing excuses from live snapshot
    const liveWar = await getLiveWar();
    const existingExcuses: Record<string, string> = {};
    if (liveWar && liveWar.seasonId === race.sectionIndex) {
      liveWar.participants.forEach(p => {
        if (p.status === 'excused' && p.excuseReason) {
          existingExcuses[p.tag] = p.excuseReason;
        }
      });
    }

    // 4. Determine if day just closed
    const isWarPeriod = race.periodType === 'warDay' || race.periodType === 'combat' || race.periodType === 'colosseum';
    const dayOfWeek = race.periodIndex % 7;
    const currentBattleDay = isWarPeriod && dayOfWeek >= 3 ? (dayOfWeek - 3) + 1 : 0;
    const previousPeriod = liveWar ? liveWar.battleDay : -1;
    const previousSeason = liveWar ? liveWar.seasonId : -1;
    
    const seasonChanged = liveWar && previousSeason !== race.sectionIndex;
    const dayChanged = liveWar && previousSeason === race.sectionIndex && previousPeriod > 0 && currentBattleDay > 0 && previousPeriod !== currentBattleDay;
    const isClosingDay = (dayChanged || seasonChanged) && previousPeriod > 0;

    if (isClosingDay) {
      console.log(`Closing day ${previousPeriod} (Season ${previousSeason}).`);
      
      const finalSnapshot = {
        ...liveWar,
        timestamp: new Date().toISOString(),
        participants: liveWar.participants.map(p => ({
          ...p,
          status: p.status === 'excused' ? 'excused' : p.decksUsedToday === 0 ? 'absent' : (p.decksUsedToday < 4 ? 'partial' : 'ok')
        }))
      } as any;
      
      await saveWarSnapshot(liveWar.seasonId, liveWar.battleDay, finalSnapshot);

      // Aggiornamento Statistiche Storiche (Wall of Fame)
      try {
        const stats = await getClanStats();
        finalSnapshot.participants.forEach((p: any) => {
          if (!stats[p.tag]) {
            stats[p.tag] = { tag: p.tag, name: p.name, totalWars: 0, totalDecksUsed: 0, totalDecksExpected: 0, missedAttacks: 0, perfectDays: 0 };
          }
          // Non contare gli attacchi mancati se è stato scusato
          const expected = p.status === 'excused' ? p.decksUsedToday : 4;
          const missed = Math.max(0, expected - p.decksUsedToday);
          
          stats[p.tag].totalWars += 1;
          stats[p.tag].totalDecksUsed += p.decksUsedToday;
          stats[p.tag].totalDecksExpected += expected;
          stats[p.tag].missedAttacks += missed;
          if (p.decksUsedToday >= 4) {
            stats[p.tag].perfectDays += 1;
          }
          if (p.status === 'excused') {
            stats[p.tag].totalExcusedDays = (stats[p.tag].totalExcusedDays || 0) + 1;
            stats[p.tag].lastExcusedDate = new Date().toISOString();
          }
        });
        await saveClanStats(stats);
      } catch (e) {
        console.error('Failed to update clan stats', e);
      }
    }

    // 5. Build and save new live snapshot
    const newSnapshot = buildWarSnapshot(race, apiMembers, false, existingExcuses);
    await saveLiveWar(newSnapshot);

    return apiSuccess({ 
      success: true, 
      dayChanged: isClosingDay, 
      battleDay: newSnapshot.battleDay,
      periodType: newSnapshot.periodType,
      updatedAt: newSnapshot.timestamp
    });

  } catch (error) {
    return handleApiError(error);
  }
}
