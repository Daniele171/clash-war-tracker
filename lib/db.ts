import { createClient } from '@supabase/supabase-js';

export interface ClanMember {
  tag: string;
  name: string;
  role: string;
  active: boolean;
  joinedDate?: string;
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

// Create a singleton Supabase admin client for database operations
// This bypasses RLS and should only be used server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

const KEYS = {
  MEMBERS: 'cwt:members',
  WAR_SNAP: (seasonId: number, day: number) => `cwt:war:${seasonId}:day:${day}`,
  WAR_LIVE: 'cwt:war:live',
  SETTINGS: 'cwt:settings',
};

export async function getJson(key: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('kv_store')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found, equivalent to null in KV
        return null;
      }
      console.error('Supabase KV get error', error);
      return null;
    }
    
    return data?.value;
  } catch (e) {
    console.error('Supabase KV get exception', e);
    return null;
  }
}

export async function setJson(key: string, value: any) {
  try {
    const { error } = await supabaseAdmin
      .from('kv_store')
      .upsert({ key, value }, { onConflict: 'key' });
      
    if (error) {
      console.error('Supabase KV set error', error);
    }
  } catch (e) {
    console.error('Supabase KV set exception', e);
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

export async function getSeasonSnapshots(seasonId: number): Promise<WarSnapshot[]> {
  try {
    const prefix = `cwt:war:${seasonId}:day:`;
    const { data, error } = await supabaseAdmin
      .from('kv_store')
      .select('value')
      .like('key', `${prefix}%`);
      
    if (error) {
      console.error('Supabase KV list error', error);
      return [];
    }
    
    if (!data) return [];
    
    return data.map(row => row.value as WarSnapshot).sort((a, b) => a.battleDay - b.battleDay);
  } catch (e) {
    console.error('Supabase KV list exception', e);
    return [];
  }
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
