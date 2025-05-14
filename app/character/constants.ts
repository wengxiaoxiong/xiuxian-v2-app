// 各等级的属性上限和下限
export const LevelAttributeLimits = {
  "炼气": {
    寿元: { max: 150 },
    道心: { max: 2 },
    体魄: { max: 50 },
    灵力: { max: 50 }
  },
  "筑基": {
    寿元: { max: 200 },
    道心: { max: 2.5 },
    体魄: { max: 70 },
    灵力: { max: 70 }
  },
  "金丹": {
    寿元: { max: 250 },
    道心: { max: 3 },
    体魄: { max: 100 },
    灵力: { max: 100 }
  },
  "元婴": {
    寿元: { max: 350 },
    道心: { max: 3.5 },
    体魄: { max: 130 },
    灵力: { max: 130 }
  },
  "化神": {
    寿元: { max: 450 },
    道心: { max: 4 },
    体魄: { max: 170 },
    灵力: { max: 170 }
  },
  "炼虚": {
    寿元: { max: 600 },
    道心: { max: 4.5 },
    体魄: { max: 210 },
    灵力: { max: 210 }
  },
  "合体": {
    寿元: { max: 750 },
    道心: { max: 5 },
    体魄: { max: 250 },
    灵力: { max: 250 }
  },
  "渡劫": {
    寿元: { max: 900 },
    道心: { max: 6 },
    体魄: { max: 300 },
    灵力: { max: 300 }
  },
  "真仙": {
    寿元: { max: 1000 },
    道心: { max: 7 },
    体魄: { max: 350 },
    灵力: { max: 350 }
  }
} as const;


// 根据等级获取属性限制
export function getAttributeLimitsByLevel(level: keyof typeof LevelAttributeLimits) {
  return LevelAttributeLimits[level];
}

