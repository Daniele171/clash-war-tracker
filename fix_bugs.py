import os

# Fix war-utils.ts
utils_path = '/Users/daniele/Desktop/clash-war-tracker/lib/war-utils.ts'
with open(utils_path, 'r') as f:
    utils = f.read()

utils = utils.replace(
    "const isWarDay = race.periodType === 'combat' || race.periodType === 'colosseum';",
    "const dayOfWeek = race.periodIndex % 7;\n  const isWarDay = (race.periodType === 'combat' || race.periodType === 'colosseum') && dayOfWeek >= 3;"
).replace(
    "const dayOfWeek = race.periodIndex % 7;\n  const battleDay = isWarDay ? (dayOfWeek - 3) + 1 : 0;",
    "const battleDay = isWarDay ? (dayOfWeek - 3) + 1 : 0;"
)
with open(utils_path, 'w') as f:
    f.write(utils)

# Fix history route
history_path = '/Users/daniele/Desktop/clash-war-tracker/app/api/history/route.ts'
with open(history_path, 'r') as f:
    history = f.read()

old_logic = "const ourClan = item.standings.find((s: any) => s.clan.tag === tag.toUpperCase() || s.clan.tag === `#${tag.toUpperCase()}`);"
new_logic = "const cleanTag = tag.startsWith('#') ? tag.toUpperCase() : '#' + tag.toUpperCase();\n      const ourClan = item.standings.find((s: any) => s.clan.tag === cleanTag);"
history = history.replace(old_logic, new_logic)

with open(history_path, 'w') as f:
    f.write(history)

