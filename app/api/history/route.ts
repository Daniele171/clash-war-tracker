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
    const cleanTag = tag.startsWith('#') ? tag.toUpperCase() : '#' + tag.toUpperCase();

    const history = log.items.map((item: any) => {
      let ourClanData: any = null;
      let rank: number | null = null;
      let trophyChange: number | null = null;

      // === River Race (standard): has standings array with 5 clans ===
      if (Array.isArray(item.standings) && item.standings.length > 0) {
        const entry = item.standings.find(
          (s: any) => s?.clan?.tag === cleanTag
        );
        if (entry) {
          ourClanData = entry.clan;
          rank = entry.rank ?? null;
          trophyChange = entry.trophyChange ?? null;
        }
      }

      // === Colosseum or alternate structure: clan might be at root level ===
      if (!ourClanData && item.clan && item.clan.tag === cleanTag) {
        ourClanData = item.clan;
      }

      // === Last fallback: search all possible nested paths ===
      if (!ourClanData && item.clans) {
        const found = (item.clans as any[]).find((c: any) => c?.tag === cleanTag);
        if (found) ourClanData = found;
      }

      if (!ourClanData) {
        // Log in dev so we can debug future unknown structures
        console.warn(`History: could not find clan ${cleanTag} in item`, JSON.stringify(Object.keys(item)));
        return null;
      }

      const participants = (ourClanData.participants || [])
        .filter((p: any) => p.decksUsed > 0) // only those who actually played
        .map((p: any) => {
          const m = dbMembers.find(dbm => dbm.tag === p.tag);
          return {
            tag: p.tag,
            name: p.name,
            medals: p.fame || p.medals || 0,
            decksUsed: p.decksUsed || 0,
            role: m?.role || 'member'
          };
        });

      // Also include current members who did 0 attacks (they won't be in participants)
      const activeTags = new Set(participants.map((p: any) => p.tag));
      const memberList = dbMembers.filter(m => m.active);
      const absentees = memberList
        .filter(m => !activeTags.has(m.tag))
        .map(m => ({
          tag: m.tag,
          name: m.name,
          medals: 0,
          decksUsed: 0,
          role: m.role
        }));

      return {
        seasonId: item.seasonId,
        sectionIndex: item.sectionIndex,
        createdDate: item.createdDate,
        isColosseum: !Array.isArray(item.standings) || item.standings.length === 0,
        rank,
        trophyChange,
        clan: {
          tag: ourClanData.tag,
          fame: ourClanData.fame || 0,
          participants: [...participants, ...absentees]
        }
      };
    }).filter(Boolean);

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
