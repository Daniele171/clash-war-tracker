import { getRiverRaceLog } from '@/lib/cr-api';
import { getMembers } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiSuccess, apiError, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAuth();

    const tag = process.env.CLAN_TAG;
    if (!tag) {
      return apiError('CLAN_TAG non configurato', 500);
    }

    const log = await getRiverRaceLog(tag);
    const dbMembers = await getMembers();
    const cleanTag = tag.startsWith('#') ? tag.toUpperCase() : '#' + tag.toUpperCase();

    const history = (log.items || []).map((item: any) => {
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
        return null;
      }

      const participants = (ourClanData.participants || [])
        .filter((p: any) => p.decksUsed > 0)
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

      // Include current members who did 0 attacks
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

    return apiSuccess(history);
  } catch (error) {
    return handleApiError(error);
  }
}
