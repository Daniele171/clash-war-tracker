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

    // Get historical stats for excuses
    const stats = await getClanStats();

    // Inject breakdown directly into each participant
    const enrichedParticipants = liveWar.participants.map(p => ({
      ...p,
      missedDaysBreakdown: missedDecksByTag[p.tag] || [],
      totalExcusedDays: stats[p.tag]?.totalExcusedDays || 0,
      lastExcusedDate: stats[p.tag]?.lastExcusedDate || null
    }));

    return apiSuccess({ ...liveWar, participants: enrichedParticipants });
  } catch (error) {
    return handleApiError(error);
  }
}
