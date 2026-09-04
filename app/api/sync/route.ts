import { NextResponse } from 'next/server';
import { getCurrentRiverRace, getClanMembers } from '@/lib/cr-api';
import { getLiveWar, saveLiveWar, saveWarSnapshot, getMembers, saveMembers } from '@/lib/db';
import { buildWarSnapshot } from '@/lib/war-utils';

export async function GET(request: Request) {
  // 1. Verify cron secret (if set)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tag = process.env.CLAN_TAG;
  if (!tag) {
    return NextResponse.json({ error: 'CLAN_TAG not configured' }, { status: 500 });
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
        active: true
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
       return NextResponse.json({ status: 'No active race data' });
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
    const isWarPeriod = race.periodType === 'combat' || race.periodType === 'colosseum';
    const dayOfWeek = race.periodIndex % 7;
    const currentBattleDay = isWarPeriod && dayOfWeek >= 3 ? (dayOfWeek - 3) + 1 : 0;
    const previousPeriod = liveWar ? liveWar.battleDay : -1;
    const previousSeason = liveWar ? liveWar.seasonId : -1;
    // dayChanged = same season, both war days, day number actually changed
    const dayChanged = liveWar
      && previousSeason === race.sectionIndex
      && previousPeriod > 0
      && currentBattleDay > 0
      && previousPeriod !== currentBattleDay;

    if (dayChanged) {
      // Day is over! Finalize the previous day's snapshot and save it
      console.log(`Day changed from ${previousPeriod} to ${currentBattleDay}. Finalizing day ${previousPeriod}.`);
      
      const finalSnapshot = {
        ...liveWar,
        timestamp: new Date().toISOString(),
        participants: liveWar.participants.map(p => ({
          ...p,
          // excused stays excused; everyone else gets final verdict
          status: p.status === 'excused' ? 'excused' : p.decksUsedToday === 0 ? 'absent' : (p.decksUsedToday < 4 ? 'partial' : 'ok')
        }))
      } as any;
      
      await saveWarSnapshot(liveWar.seasonId, liveWar.battleDay, finalSnapshot);
    }

    // 5. Build and save new live snapshot
    const newSnapshot = buildWarSnapshot(race, apiMembers, false, existingExcuses);
    await saveLiveWar(newSnapshot);

    return NextResponse.json({ 
      success: true, 
      dayChanged, 
      battleDay: newSnapshot.battleDay,
      periodType: newSnapshot.periodType,
      updatedAt: newSnapshot.timestamp
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
