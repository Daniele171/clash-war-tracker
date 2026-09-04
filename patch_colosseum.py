import os

utils_path = '/Users/daniele/Desktop/clash-war-tracker/lib/war-utils.ts'
with open(utils_path, 'r') as f:
    utils = f.read()

# 1. Update isWarDay
old_isWarDay = "const isWarDay = race.periodType === 'combat';"
new_isWarDay = "const isWarDay = race.periodType === 'combat' || race.periodType === 'colosseum';"
utils = utils.replace(old_isWarDay, new_isWarDay)

# 2. Update battleDay calculation
old_battleDay = "const battleDay = race.periodType === 'combat' ? (race.periodIndex - 3) + 1 : 0;"
new_battleDay = "const dayOfWeek = race.periodIndex % 7;\n  const battleDay = isWarDay ? (dayOfWeek - 3) + 1 : 0;"
utils = utils.replace(old_battleDay, new_battleDay)

# 3. Also fix the interface type to allow 'colosseum'
old_periodType = "periodType: 'training' | 'combat';"
new_periodType = "periodType: 'training' | 'combat' | 'colosseum';"
utils = utils.replace(old_periodType, new_periodType)

with open(utils_path, 'w') as f:
    f.write(utils)

db_path = '/Users/daniele/Desktop/clash-war-tracker/lib/db.ts'
with open(db_path, 'r') as f:
    db = f.read()
db = db.replace(old_periodType, new_periodType)
with open(db_path, 'w') as f:
    f.write(db)

