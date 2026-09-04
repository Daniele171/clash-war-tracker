import { createClient } from 'redis';

// Vercel Upstash Redis Integration generates REDIS_URL
let redisClient: any = null;

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || process.env.KV_REST_API_URL || ''
    });
    redisClient.on('error', (err: any) => {
      console.error('Redis Client Error', err);
      // Reset on fatal errors so next call reconnects
      redisClient = null;
    });
    await redisClient.connect();
  } else if (!redisClient.isOpen) {
    try { await redisClient.connect(); } catch {}
  }
  return redisClient;
}

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
    const client = await getRedis();
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    console.error('Redis get error', e);
    return null;
  }
}

export async function setJson(key: string, value: any) {
  try {
    const client = await getRedis();
    await client.set(key, JSON.stringify(value));
  } catch (e) {
    console.error('Redis set error', e);
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
