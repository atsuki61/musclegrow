export type Big3Key = "benchPress" | "squat" | "deadlift";

export interface Big3Metric {
  name: string;
  current: number;
  target: number;
  color: string;
}

export type Big3ProgressData = Record<Big3Key, Big3Metric>;

export type Big3Targets = Record<Big3Key, number>;

export type Big3Weights = Record<Big3Key, number>;

export const DEFAULT_BIG3_TARGETS: Big3Targets = {
  benchPress: 100,
  squat: 120,
  deadlift: 140,
};

const BIG3_META: Record<Big3Key, { name: string; color: string }> = {
  benchPress: { name: "ベンチプレス", color: "bg-red-500" },
  squat: { name: "スクワット", color: "bg-green-500" },
  deadlift: { name: "デッドリフト", color: "bg-blue-500" },
};

export function createBig3Data(
  weights: Big3Weights,
  targets: Big3Targets
): Big3ProgressData {
  return {
    benchPress: {
      name: BIG3_META.benchPress.name,
      current: weights.benchPress,
      target: targets.benchPress,
      color: BIG3_META.benchPress.color,
    },
    squat: {
      name: BIG3_META.squat.name,
      current: weights.squat,
      target: targets.squat,
      color: BIG3_META.squat.color,
    },
    deadlift: {
      name: BIG3_META.deadlift.name,
      current: weights.deadlift,
      target: targets.deadlift,
      color: BIG3_META.deadlift.color,
    },
  };
}

