import { kv } from '@vercel/kv';

export interface ClanMember {
  tag: string;
  name: string;
  role: string;
  active: boolean;
}

export interface WarSnapshot {
  seasonId: number;
  sectionIndex: number;
  battleDay: number; // 1-4
  periodType: 'training' | 'combat';
  timestamp: string;
  participants: {
    tag: string;
    name: string;
    medals: number;
    decksUsedToday: number;
    status: 'ok' | 'partial' | 'absent' | 'pending' | 'excused';
    excuseReason?: string;
  }[];
}

const KEYS = {
  MEMBERS: 'cwt:members',
  WAR_SNAP: (seasonId: number, day: number) => `cwt:war:${seasonId}:day:${day}`,
  WAR_LIVE: 'cwt:war:live',
  SETTINGS: 'cwt:settings',
};

// --- Members ---
export async function getMembers(): Promise<ClanMember[]> {
  return (await kv.get<ClanMember[]>(KEYS.MEMBERS)) || [];
}

export async function saveMembers(members: ClanMember[]) {
  await kv.set(KEYS.MEMBERS, members);
}

// --- Wars ---
export async function saveWarSnapshot(seasonId: number, day: number, snapshot: WarSnapshot) {
  await kv.set(KEYS.WAR_SNAP(seasonId, day), snapshot);
}

export async function getWarSnapshot(seasonId: number, day: number): Promise<WarSnapshot | null> {
  return kv.get<WarSnapshot>(KEYS.WAR_SNAP(seasonId, day));
}

export async function saveLiveWar(snapshot: WarSnapshot) {
  await kv.set(KEYS.WAR_LIVE, snapshot);
}

export async function getLiveWar(): Promise<WarSnapshot | null> {
  return kv.get<WarSnapshot>(KEYS.WAR_LIVE);
}

// --- Excuses ---
// Excuses are stored within the live war data, but we can have a helper
export async function setExcuse(tag: string, reason: string) {
  const live = await getLiveWar();
  if (!live) return false;
  
  const p = live.participants.find(p => p.tag === tag);
  if (p) {
    p.status = 'excused';
    p.excuseReason = reason;
    await saveLiveWar(live);
    return true;
  }
  return false;
}

export async function removeExcuse(tag: string) {
  const live = await getLiveWar();
  if (!live) return false;
  
  const p = live.participants.find(p => p.tag === tag);
  if (p) {
    // Recalculate status based on decksUsedToday
    p.status = p.decksUsedToday === 0 ? 'pending' : p.decksUsedToday < 4 ? 'partial' : 'ok';
    p.excuseReason = undefined;
    await saveLiveWar(live);
    return true;
  }
  return false;
}
