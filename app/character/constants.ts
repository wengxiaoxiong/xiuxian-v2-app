// 修仙等级属性限制配置文件
// 定义每个等级的属性上限和下限

// 等级突破后的奖励范围
export const LevelAttributeRewards = {
  "炼气": {
    寿元: [20, 30],
    道心: 0.5,
    体魄: [10, 15],
    灵力: [10, 15],
    突破难度系数: 0.9
  },
  "筑基": {
    寿元: [30, 40],
    道心: 0.5,
    体魄: [15, 20],
    灵力: [15, 20],
    突破难度系数: 0.85
  },
  "金丹": {
    寿元: [40, 50],
    道心: 0.5,
    体魄: [20, 25],
    灵力: [20, 25],
    突破难度系数: 0.8
  },
  "元婴": {
    寿元: [50, 60],
    道心: 0.5,
    体魄: [25, 30],
    灵力: [25, 30],
    突破难度系数: 0.7
  },
  "化神": {
    寿元: [60, 70],
    道心: 0.5,
    体魄: [30, 35],
    灵力: [30, 35],
    突破难度系数: 0.6
  },
  "炼虚": {
    寿元: [70, 80],
    道心: 0.5,
    体魄: [35, 40],
    灵力: [35, 40],
    突破难度系数: 0.5
  },
  "合体": {
    寿元: [80, 90],
    道心: 0.5,
    体魄: [40, 45],
    灵力: [40, 45],
    突破难度系数: 0.3
  },
  "渡劫": {
    寿元: [90, 100],
    道心: 0.5,
    体魄: [45, 50],
    灵力: [45, 50],
    突破难度系数: 0.1
  },
  "真仙": {
    寿元: [100, 150],
    道心: 0.5,
    体魄: [50, 60],
    灵力: [50, 60],
    突破难度系数: 0.05
  }
} as const;

// 各等级的属性上限和下限
export const LevelAttributeLimits = {
  "炼气": {
    寿元: { min: 100, max: 150 },
    道心: { min: 1, max: 2 },
    体魄: { min: 30, max: 50 },
    灵力: { min: 30, max: 50 }
  },
  "筑基": {
    寿元: { min: 150, max: 200 },
    道心: { min: 1.5, max: 2.5 },
    体魄: { min: 50, max: 70 },
    灵力: { min: 50, max: 70 }
  },
  "金丹": {
    寿元: { min: 200, max: 250 },
    道心: { min: 2, max: 3 },
    体魄: { min: 70, max: 100 },
    灵力: { min: 70, max: 100 }
  },
  "元婴": {
    寿元: { min: 250, max: 350 },
    道心: { min: 2.5, max: 3.5 },
    体魄: { min: 100, max: 130 },
    灵力: { min: 100, max: 130 }
  },
  "化神": {
    寿元: { min: 350, max: 450 },
    道心: { min: 3, max: 4 },
    体魄: { min: 130, max: 170 },
    灵力: { min: 130, max: 170 }
  },
  "炼虚": {
    寿元: { min: 450, max: 600 },
    道心: { min: 3.5, max: 4.5 },
    体魄: { min: 170, max: 210 },
    灵力: { min: 170, max: 210 }
  },
  "合体": {
    寿元: { min: 600, max: 750 },
    道心: { min: 4, max: 5 },
    体魄: { min: 210, max: 250 },
    灵力: { min: 210, max: 250 }
  },
  "渡劫": {
    寿元: { min: 750, max: 900 },
    道心: { min: 4.5, max: 6 },
    体魄: { min: 250, max: 300 },
    灵力: { min: 250, max: 300 }
  },
  "真仙": {
    寿元: { min: 900, max: 1000 },
    道心: { min: 5, max: 7 },
    体魄: { min: 300, max: 350 },
    灵力: { min: 300, max: 350 }
  }
} as const;

// 获取随机奖励值的工具函数
export function getRandomRewardValue(range: [number, number]): number {
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 根据等级获取属性限制
export function getAttributeLimitsByLevel(level: keyof typeof LevelAttributeLimits) {
  return LevelAttributeLimits[level];
}

// 根据等级获取突破奖励
export function getBreakthroughRewardsByLevel(level: keyof typeof LevelAttributeRewards) {
  return LevelAttributeRewards[level];
}

// 根据等级和属性类型，验证属性值是否在合理范围内
export function validateAttributeValue(
  level: keyof typeof LevelAttributeLimits,
  attributeType: keyof (typeof LevelAttributeLimits)["炼气"],
  value: number
): number {
  const limits = LevelAttributeLimits[level][attributeType];
  return Math.max(limits.min, Math.min(limits.max, value));
} 