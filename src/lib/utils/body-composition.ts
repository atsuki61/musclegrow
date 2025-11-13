/**
 * 体組成計算ユーティリティ
 *
 * 体重、体脂肪率、筋肉量から体組成の内訳を計算します。
 */

/**
 * 体組成の内訳の型
 */
export interface BodyComposition {
  fatMass: number; // 体脂肪量（kg）
  fatMassPercentage: number; // 体脂肪率（%）
  muscleMass: number; // 筋肉量（kg）
  muscleMassPercentage: number; // 筋肉量の割合（%）
  otherMass: number; // その他（骨・水分等）の量（kg）
  otherMassPercentage: number; // その他の割合（%）
}

/**
 * 体組成データが有効かどうかを判定する
 *
 * @param weight 体重（kg）
 * @param bodyFat 体脂肪率（%）
 * @param muscleMass 筋肉量（kg）
 * @returns 有効な場合はtrue
 */
export function isBodyCompositionValid(
  weight: number,
  bodyFat: number,
  muscleMass: number
): boolean {
  // すべての値が正の数である必要がある
  if (weight <= 0 || bodyFat < 0 || muscleMass < 0) {
    return false;
  }

  // 体脂肪率は100%以下である必要がある
  if (bodyFat > 100) {
    return false;
  }

  // 体脂肪量と筋肉量の合計が体重を超えない必要がある
  const fatMass = (weight * bodyFat) / 100;
  if (fatMass + muscleMass > weight) {
    return false;
  }

  return true;
}

/**
 * 体組成の内訳を計算する
 *
 * @param weight 体重（kg）
 * @param bodyFat 体脂肪率（%）
 * @param muscleMass 筋肉量（kg）
 * @returns 体組成の内訳
 */
export function calculateBodyComposition(
  weight: number,
  bodyFat: number,
  muscleMass: number
): BodyComposition {
  // 体脂肪量を計算（体重 × 体脂肪率 / 100）
  const fatMass = (weight * bodyFat) / 100;

  // その他の量を計算（体重 - 体脂肪量 - 筋肉量）
  const otherMass = weight - fatMass - muscleMass;

  // 各割合を計算
  const fatMassPercentage = (fatMass / weight) * 100;
  const muscleMassPercentage = (muscleMass / weight) * 100;
  const otherMassPercentage = (otherMass / weight) * 100;

  return {
    fatMass: Math.round(fatMass * 10) / 10, // 小数点第1位まで
    fatMassPercentage: Math.round(fatMassPercentage * 10) / 10,
    muscleMass: Math.round(muscleMass * 10) / 10,
    muscleMassPercentage: Math.round(muscleMassPercentage * 10) / 10,
    otherMass: Math.round(otherMass * 10) / 10,
    otherMassPercentage: Math.round(otherMassPercentage * 10) / 10,
  };
}

