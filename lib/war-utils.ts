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
  periodType: 'training' | 'combat';
  sectionIndex: number;
  periodIndex: number;
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
  if (!isWarDay) return 'ok'; // Training days don't penalize
  
  if (decksUsedToday >= 4) return 'ok';
  
  if (decksUsedToday > 0) return 'partial'; // Played some, but not all
  
  // 0 decks used
  if (isDayClosed) return 'absent'; // Day is over, they missed it
  
  return 'pending'; // Day is still ongoing
}

export function buildWarSnapshot(race: CRRiverRace, allMembers: any[], isDayClosed = false, existingExcuses: Record<string, string> = {}): WarSnapshot {
  const isWarDay = race.periodType === 'combat';
  // Battle day 1-4 based on periodIndex (which goes 0-6).
  // Assuming 0,1,2 = training, 3,4,5,6 = combat (battleDay 1,2,3,4)
  const battleDay = race.periodType === 'combat' ? (race.periodIndex - 3) + 1 : 0;
  
  return {
    seasonId: race.sectionIndex, // using sectionIndex as season ID proxy
    sectionIndex: race.sectionIndex,
    battleDay: battleDay > 0 ? battleDay : 1, // Fallback to 1 if not combat
    periodType: race.periodType,
    timestamp: new Date().toISOString(),
    participants: allMembers.map((member: any) => {
      const p = (race.clan.participants || []).find((rp: any) => rp.tag === member.tag);
      const decksUsedToday = p ? p.decksUsedToday : 0;
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
        status,
        excuseReason: existingExcuses[member.tag]
      };
    })
  };
}
