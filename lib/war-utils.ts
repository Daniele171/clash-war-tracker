import { WarSnapshot } from './db';

// CR API types
export interface CRParticipant {
  tag: string;
  name: string;
  fame: number;
  medals: number;
  repairPoints: number;
  boatAttacks: number;
  decksUsed: number;
  decksUsedToday: number;
}

export interface CRRiverRace {
  state: string;
  periodType: 'training' | 'combat' | 'colosseum' | 'warDay';
  sectionIndex: number;
  periodIndex: number;
  clans?: any[];
  clan: {
    tag: string;
    name: string;
    badgeId: number;
    fame: number;
    medals: number;
    participants: CRParticipant[];
  };
}

export function determineStatus(decksUsedToday: number, isWarDay: boolean, isDayClosed: boolean): WarSnapshot['participants'][0]['status'] {
  if (!isWarDay) {
    // Training day: not mandatory. Show 'ok' only if they actually attacked voluntarily.
    return decksUsedToday > 0 ? 'ok' : 'training';
  }

  if (decksUsedToday >= 4) return 'ok';        // All 4 decks used ✅
  if (decksUsedToday > 0) return 'partial';    // Used some, not all ⚠️
  if (isDayClosed) return 'absent';             // Day ended, missed it ❌
  return 'pending';                             // Day still ongoing, hasn't played yet ⏳
}

export function buildWarSnapshot(race: CRRiverRace, allMembers: any[], isDayClosed = false, existingExcuses: Record<string, string> = {}): WarSnapshot {
  const dayOfWeek = race.periodIndex % 7;
  const isWarDay = race.periodType === 'warDay' || race.periodType === 'combat' || race.periodType === 'colosseum';
  // Battle day 1-4 based on periodIndex (which goes 0-6).
  // Assuming 0,1,2 = training, 3,4,5,6 = combat (battleDay 1,2,3,4)
  // periodIndex 3,4,5,6 -> battleDay 1,2,3,4
  const battleDay = isWarDay ? Math.max(1, (race.periodIndex % 7) - 2) : 0;
  
  let clansData: any[] = [];
  if (race.clans && Array.isArray(race.clans)) {
    clansData = race.clans.map((c: any) => ({
      tag: c.tag,
      name: c.name,
      badgeId: c.badgeId,
      fame: c.fame,
      periodPoints: c.periodPoints
    }));
  }

  return {
    seasonId: race.sectionIndex, // using sectionIndex as season ID proxy
    sectionIndex: race.sectionIndex,
    battleDay: battleDay > 0 ? battleDay : 0,
    periodType: race.periodType,
    timestamp: new Date().toISOString(),
    clans: clansData,
    participants: allMembers.map((member: any) => {
      const p = (race.clan.participants || []).find((rp: any) => rp.tag === member.tag);
      const decksUsedToday = p ? p.decksUsedToday : 0;
      const decksUsedTotal = p ? p.decksUsed : 0;
      const medals = p ? (p.medals || p.fame || 0) : 0;
      
      let status = determineStatus(decksUsedToday, isWarDay, isDayClosed);
      
      if (existingExcuses[member.tag]) {
        status = 'excused';
      }
      
      return {
        tag: member.tag,
        name: member.name,
        medals,
        decksUsedToday,
        decksUsedTotal,
        status,
        excuseReason: existingExcuses[member.tag]
      };
    })
  };
}
