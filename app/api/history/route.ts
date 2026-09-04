import { NextResponse } from 'next/server';
import { getRiverRaceLog } from '@/lib/cr-api';
import { getMembers } from '@/lib/db';

export async function GET() {
  const tag = process.env.CLAN_TAG;
  if (!tag) {
    return NextResponse.json({ error: 'CLAN_TAG not configured' }, { status: 500 });
  }

  try {
    const log = await getRiverRaceLog(tag);
    const dbMembers = await getMembers();
    
    const history = log.items.map((item: any) => {
      const ourClan = item.standings.find((s: any) => s.clan.tag === tag.toUpperCase() || s.clan.tag === `#${tag.toUpperCase()}`);
      
      if (!ourClan) return null;
      
      return {
        seasonId: item.seasonId,
        sectionIndex: item.sectionIndex,
        createdDate: item.createdDate,
        clan: {
          tag: ourClan.clan.tag,
          fame: ourClan.clan.fame,
          participants: ourClan.clan.participants.map((p: any) => {
            const m = dbMembers.find(dbm => dbm.tag === p.tag);
            return {
              tag: p.tag,
              name: p.name,
              medals: p.fame || p.medals,
              decksUsed: p.decksUsed,
              role: m?.role || 'Unknown'
            };
          })
        }
      };
    }).filter(Boolean);

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
