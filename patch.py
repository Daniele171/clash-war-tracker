import os

utils_path = '/Users/daniele/Desktop/clash-war-tracker/lib/war-utils.ts'
with open(utils_path, 'r') as f:
    utils = f.read()

utils = utils.replace(
    'export function buildWarSnapshot(race: CRRiverRace, isDayClosed = false, existingExcuses: Record<string, string> = {}): WarSnapshot {',
    'export function buildWarSnapshot(race: CRRiverRace, allMembers: any[], isDayClosed = false, existingExcuses: Record<string, string> = {}): WarSnapshot {'
)

utils_old_participants = '''    participants: race.clan.participants.map(p => {
      let status = determineStatus(p.decksUsedToday, isWarDay, isDayClosed);
      
      // Override with excuse if exists
      if (existingExcuses[p.tag]) {
        status = 'excused';
      }
      
      return {
        tag: p.tag,
        name: p.name,
        medals: p.medals || p.fame || 0, // Fallback for older API versions
        decksUsedToday: p.decksUsedToday,
        status,
        excuseReason: existingExcuses[p.tag]
      };
    })'''

utils_new_participants = '''    participants: allMembers.map((member: any) => {
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
    })'''

utils = utils.replace(utils_old_participants, utils_new_participants)

with open(utils_path, 'w') as f:
    f.write(utils)


route_path = '/Users/daniele/Desktop/clash-war-tracker/app/api/sync/route.ts'
with open(route_path, 'r') as f:
    route = f.read()

route = route.replace(
    'const newSnapshot = buildWarSnapshot(race, false, existingExcuses);',
    'const newSnapshot = buildWarSnapshot(race, apiMembers, false, existingExcuses);'
)

with open(route_path, 'w') as f:
    f.write(route)

