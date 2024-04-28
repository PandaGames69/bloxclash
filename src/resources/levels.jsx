export const levels = Object.entries({
  "1": 0,
  "2": 1000,
  "3": 5657,
  "4": 15589,
  "5": 32000,
  "6": 55902,
  "7": 88182,
  "8": 129642,
  "9": 181020,
  "10": 243000,
  "11": 316228,
  "12": 401312,
  "13": 498831,
  "14": 609339,
  "15": 733365,
  "16": 871422,
  "17": 1024000,
  "18": 1191578,
  "19": 1374616,
  "20": 1573563,
  "21": 1788855,
  "22": 2020916,
  "23": 2270162,
  "24": 2536995,
  "25": 2821813,
  "26": 3125000,
  "27": 3446938,
  "28": 3787996,
  "29": 4148539,
  "30": 4528924,
  "31": 4929504,
  "32": 5350622,
  "33": 5792619,
  "34": 6255829,
  "35": 6740581,
  "36": 7247198,
  "37": 7776000,
  "38": 8327302,
  "39": 8901414,
  "40": 9498642,
  "41": 10119289,
  "42": 10763652,
  "43": 11432027,
  "44": 12124704,
  "45": 12841972,
  "46": 13584113,
  "47": 14351411,
  "48": 15144142,
  "49": 15962581,
  "50": 16807000,
  "51": 17677670,
  "52": 18574856,
  "53": 19498822,
  "54": 20449829,
  "55": 21428137,
  "56": 22434001,
  "57": 23467676,
  "58": 24529413,
  "59": 25619461,
  "60": 26738069,
  "61": 27885481,
  "62": 29061940,
  "63": 30267687,
  "64": 31502961,
  "65": 32768000,
  "66": 34063039,
  "67": 35388312,
  "68": 36744049,
  "69": 38130481,
  "70": 39547837,
  "71": 40996342,
  "72": 42476222,
  "73": 43987699,
  "74": 45530996,
  "75": 47106334,
  "76": 48713929,
  "77": 50354001,
  "78": 52026764,
  "79": 53732434,
  "80": 55471222,
  "81": 57243341,
  "82": 59049000,
  "83": 60888410,
  "84": 62761777,
  "85": 64669309,
  "86": 66611209,
  "87": 68587683,
  "88": 70598933,
  "89": 72645160,
  "90": 74726565,
  "91": 76843348,
  "92": 78995706,
  "93": 81183837,
  "94": 83407936,
  "95": 85668199,
  "96": 87964819,
  "97": 90297990,
  "98": 92667904,
  "99": 95074750,
  "100": 100000000
}).sort((a, b) => b[1] - a[1])

export function levelToXP(level) {
  let entry = levels.find(lvl => +lvl[0] === level)
  return entry ? entry[1] : 0
}

export function progressToNextLevel(xp) {
  if (typeof xp !== 'number') return 0

  let prevRequired = xpForLevel(xp)
  let xpRequired = getUserNextLevel(xp)
  return (xpRequired - xp) / (xpRequired - prevRequired) * 100
}

export function getUserNextLevel(xp) {
  if (typeof xp !== 'number') return 0
  if (xp > 100000000) { return 1 }

  for (let i = 0; i < levels.length; i++) {
    const [level, xpRequired] = levels[i];
    if (xp >= xpRequired) return levels[i - 1][1] || 0;
  }
  return 100
}

export function xpForLevel(xp) {
  if (typeof xp !== 'number') return xp

  for (let i = 0; i < levels.length; i++) {
    const [level, xpRequired] = levels[i];
    if (xp >= xpRequired) return xpRequired;
  }
  return 0
}

export function getUserLevel(xp) {
  if (typeof xp !== 'number') return xp
  if (xp > 100000000) { return 100 }

  for (let i = 0; i < levels.length; i++) {
    const [level, xpRequired] = levels[i];
    if (xp >= xpRequired) return +level;
  }
  return 0
}