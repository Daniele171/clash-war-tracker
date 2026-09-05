import { NextResponse } from 'next/server';
import { getLiveWar, getSeasonSnapshots } from '@/lib/db';

export async function GET() {
  try {
    const liveWar = await getLiveWar();
    if (!liveWar) {
      return NextResponse.json({ status: 'No active war' });
    }

    const snapshots = await getSeasonSnapshots(liveWar.seasonId);
    
    // Calculate missed decks per day for each participant
    const missedDecksByTag: Record<string, { day: number; missed: number }[]> = {};

    liveWar.participants.forEach(p => {
      missedDecksByTag[p.tag] = [];
    });

    snapshots.forEach(snap => {
      if (snap.periodType === 'training') return; // Skip training days

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

    // Inject breakdown directly into each participant
    const enrichedParticipants = liveWar.participants.map(p => ({
      ...p,
      missedDaysBreakdown: missedDecksByTag[p.tag] || []
    }));

    return NextResponse.json({ ...liveWar, participants: enrichedParticipants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
