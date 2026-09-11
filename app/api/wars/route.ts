import { getLiveWar, getSeasonSnapshots, getClanStats } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiSuccess, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAuth();

    const liveWar = await getLiveWar();
    if (!liveWar) {
      return apiSuccess({ status: 'No active war' });
    }

    const snapshots = await getSeasonSnapshots(liveWar.seasonId);
    
    // Calculate missed decks per day for each participant
    const missedDecksByTag: Record<string, { day: number; missed: number }[]> = {};

    liveWar.participants.forEach(p => {
      missedDecksByTag[p.tag] = [];
    });

    // Method 1: Use stored snapshots (historical days already finalized)
    snapshots.forEach(snap => {
      if (snap.periodType === 'training') return;

      snap.participants.forEach(p => {
        if (!missedDecksByTag[p.tag]) {
          missedDecksByTag[p.tag] = [];
        }
        const maxDecks = 4;
        const missed = Math.max(0, maxDecks - p.decksUsedToday);
        if (missed > 0) {
          missedDecksByTag[p.tag].push({ day: snap.battleDay, missed });
        }
      });
    });

    // Method 2: If no snapshots (first few days), estimate from decksUsedTotal
    // The CR API gives us decksUsedTotal (whole season) and decksUsedToday
    // previousDays = decksUsed - decksUsedToday
    // expectedPreviousDays = (battleDay - 1) * 4
    // missedPrevious = max(0, expectedPreviousDays - previousDays)
    const currentBattleDay = liveWar.battleDay || 0;
    const isWarPeriod = liveWar.periodType !== 'training';
    
    if (isWarPeriod && currentBattleDay > 1 && snapshots.length === 0) {
      liveWar.participants.forEach(p => {
        const decksUsedToday = p.decksUsedToday || 0;
        const decksUsedTotal = p.decksUsedTotal || 0;
        const decksInPreviousDays = decksUsedTotal - decksUsedToday;
        const expectedInPreviousDays = (currentBattleDay - 1) * 4;
        const missedInPreviousDays = Math.max(0, expectedInPreviousDays - decksInPreviousDays);
        
        if (missedInPreviousDays > 0) {
          // We can't know exactly which day they missed, mark it as "giorni precedenti"
          missedDecksByTag[p.tag] = [{ day: currentBattleDay - 1, missed: missedInPreviousDays }];
        }
      });
    }

    // Get historical stats for excuses
    const stats = await getClanStats();

    // Inject breakdown directly into each participant
    const enrichedParticipants = liveWar.participants.map(p => ({
      ...p,
      missedDaysBreakdown: missedDecksByTag[p.tag] || [],
      totalExcusedDays: stats[p.tag]?.totalExcusedDays || 0,
      lastExcusedDate: stats[p.tag]?.lastExcusedDate || null
    }));

    return apiSuccess({ 
      ...liveWar, 
      participants: enrichedParticipants,
      ourClanTag: process.env.CLAN_TAG || '',
      clans: liveWar.clans || []
    });
  } catch (error) {
    return handleApiError(error);
  }
}
