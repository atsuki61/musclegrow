/**
 * BMI計算ユーティリティ
 *
 * BMI（Body Mass Index）の計算と判定を行います。
 */

/**
 * BMI計算結果の型
 */
export interface BMIResult {
  bmi: number; // BMI値（小数点第1位まで）
  category: "underweight" | "normal" | "overweight" | "obese"; // BMIカテゴリ
  categoryLabel: string; // カテゴリの日本語ラベル
}

/**
 * BMIを計算する
 *
 * @param height 身長（cm）
 * @param weight 体重（kg）
 * @returns BMI値（小数点第1位まで）
 */
export function calculateBMI(height: number, weight: number): number {
  if (height <= 0 || weight <= 0) {
    return 0;
  }

  // BMI = 体重(kg) / 身長(m)^2
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  // 小数点第1位までに丸める
  return Math.round(bmi * 10) / 10;
}

/**
 * BMI値からカテゴリを判定する
 *
 * @param bmi BMI値
 * @returns BMIカテゴリとラベル
 */
export function getBMICategory(bmi: number): {
  category: BMIResult["category"];
  categoryLabel: string;
} {
  if (bmi < 18.5) {
    return {
      category: "underweight",
      categoryLabel: "低体重（やせ型）",
    };
  } else if (bmi < 25) {
    return {
      category: "normal",
      categoryLabel: "標準体重（健康的な範囲内）",
    };
  } else if (bmi < 30) {
    return {
      category: "overweight",
      categoryLabel: "肥満（1度）",
    };
  } else {
    return {
      category: "obese",
      categoryLabel: "肥満（2度以上）",
    };
  }
}

/**
 * BMIを計算して結果を返す
 *
 * @param height 身長（cm）
 * @param weight 体重（kg）
 * @returns BMI計算結果
 */
export function getBMIResult(height: number, weight: number): BMIResult {
  const bmi = calculateBMI(height, weight);
  const { category, categoryLabel } = getBMICategory(bmi);

  return {
    bmi,
    category,
    categoryLabel,
  };
}

/**
 * BMI値をプログレスバー用のパーセンテージに変換する
 *
 * BMIの範囲（18.5〜30）を0〜100%にマッピングします。
 * 18.5未満は0%、30以上は100%として扱います。
 *
 * @param bmi BMI値
 * @returns プログレスバー用のパーセンテージ（0〜100）
 */
export function getBMIPercentage(bmi: number): number {
  // BMIの範囲: 18.5（標準の下限）〜 30（肥満の上限）
  const minBMI = 18.5;
  const maxBMI = 30;

  if (bmi < minBMI) {
    return 0;
  }
  if (bmi > maxBMI) {
    return 100;
  }

  // 18.5〜30の範囲を0〜100%にマッピング
  const percentage = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;

  // 0〜100の範囲に制限
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

