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
  battleDay: number;
  periodType: 'training' | 'combat' | 'colosseum';
  timestamp: string;
  participants: {
    tag: string;
    name: string;
    medals: number;
    decksUsedToday: number;
    decksUsedTotal: number;
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

export async function getJson(key: string) {
  try {
    const val = await kv.get(key);
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
    return val;
  } catch (e) {
    console.error('KV get error', e);
    return null;
  }
}

export async function setJson(key: string, value: any) {
  try {
    await kv.set(key, value);
  } catch (e) {
    console.error('KV set error', e);
  }
}

// --- Members ---
export async function getMembers(): Promise<ClanMember[]> {
  return (await getJson(KEYS.MEMBERS)) || [];
}

export async function saveMembers(members: ClanMember[]) {
  await setJson(KEYS.MEMBERS, members);
}

// --- Wars ---
export async function saveWarSnapshot(seasonId: number, day: number, snapshot: WarSnapshot) {
  await setJson(KEYS.WAR_SNAP(seasonId, day), snapshot);
}

export async function getWarSnapshot(seasonId: number, day: number): Promise<WarSnapshot | null> {
  return getJson(KEYS.WAR_SNAP(seasonId, day));
}

export async function saveLiveWar(snapshot: WarSnapshot) {
  await setJson(KEYS.WAR_LIVE, snapshot);
}

export async function getLiveWar(): Promise<WarSnapshot | null> {
  return getJson(KEYS.WAR_LIVE);
}

// --- Excuses ---
export async function setExcuse(tag: string, reason: string) {
  const live = await getLiveWar();
  if (!live) return false;
  
  const p = live.participants.find((p: any) => p.tag === tag);
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
  
  const p = live.participants.find((p: any) => p.tag === tag);
  if (p) {
    // Reset to pending — next sync call will recalculate the correct status
    p.status = 'pending';
    p.excuseReason = undefined;
    await saveLiveWar(live);
    return true;
  }
  return false;
}
