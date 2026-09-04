import os

# 1. Update lib/db.ts
db_path = '/Users/daniele/Desktop/clash-war-tracker/lib/db.ts'
with open(db_path, 'r') as f:
    db = f.read()

db = db.replace('decksUsedToday: number;', 'decksUsedToday: number;\n    decksUsedTotal: number;')
with open(db_path, 'w') as f:
    f.write(db)

# 2. Update lib/war-utils.ts
utils_path = '/Users/daniele/Desktop/clash-war-tracker/lib/war-utils.ts'
with open(utils_path, 'r') as f:
    utils = f.read()

old_participants = '''    participants: allMembers.map((member: any) => {
      const p = (race.clan.participants || []).find((rp: any) => rp.tag === member.tag);
      const decksUsedToday = p ? p.decksUsedToday : 0;
      const medals = p ? (p.medals || p.fame || 0) : 0;
      
      let status = determineStatus(decksUsedToday, isWarDay, isDayClosed);'''

new_participants = '''    participants: allMembers.map((member: any) => {
      const p = (race.clan.participants || []).find((rp: any) => rp.tag === member.tag);
      const decksUsedToday = p ? p.decksUsedToday : 0;
      const decksUsedTotal = p ? p.decksUsed : 0;
      const medals = p ? (p.medals || p.fame || 0) : 0;
      
      let status = determineStatus(decksUsedToday, isWarDay, isDayClosed);'''

old_return = '''        decksUsedToday,
        status,'''
new_return = '''        decksUsedToday,
        decksUsedTotal,
        status,'''

utils = utils.replace(old_participants, new_participants).replace(old_return, new_return)
with open(utils_path, 'w') as f:
    f.write(utils)

# 3. Update app/dashboard/page.tsx
page_path = '/Users/daniele/Desktop/clash-war-tracker/app/dashboard/page.tsx'
with open(page_path, 'r') as f:
    page = f.read()

old_th = '<th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">Attacchi Oggi</th>'
new_th = '<th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">Oggi</th>\n                <th className="bg-[rgba(240,192,48,0.07)] text-[#8888a8] text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-left border-b border-border-gold">Totali in settimana</th>'

old_td = '''<td className="px-3 py-2.5">
                      <div className="flex gap-[3px]">
                        {[0,1,2,3].map(dot => (
                          <div key={dot} className={`w-[9px] h-[9px] rounded-full ${dot < p.decksUsedToday ? 'bg-cr-green' : 'bg-[#444466]'}`} />
                        ))}
                      </div>
                    </td>'''

new_td = '''<td className="px-3 py-2.5">
                      <div className="flex gap-[3px]">
                        {[0,1,2,3].map(dot => (
                          <div key={dot} className={`w-[9px] h-[9px] rounded-full ${dot < p.decksUsedToday ? 'bg-cr-green' : 'bg-[#444466]'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-rajdhani font-bold text-[14px] text-cr-gold">{p.decksUsedTotal || p.decksUsedToday || 0} <span className="text-[10px] font-sans text-[#8888a8] font-normal">atk</span></div>
                      {p.decksUsedTotal < (data.battleDay * 4) && data.periodType === 'combat' && (
                        <div className="text-[10px] text-red-400 mt-[2px] leading-tight">Ha saltato<br/>delle war!</div>
                      )}
                    </td>'''

page = page.replace(old_th, new_th).replace(old_td, new_td)
with open(page_path, 'w') as f:
    f.write(page)

