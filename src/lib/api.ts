// API通信用関数
// サーバーアクションとのデータやり取りをここで行う

import {
  saveExercise as saveExerciseAction,
  getExercises as getExercisesAction,
} from "./actions/exercises";
import type { Exercise } from "@/types/workout";

/**
 * 種目を保存する（カスタム種目）
 */
export async function saveExercise(exercise: Exercise): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise;
}> {
  return await saveExerciseAction(exercise);
}

/**
 * 種目一覧を取得する（共通マスタ + ユーザー独自種目）
 */
export async function getExercises(): Promise<{
  success: boolean;
  error?: string;
  data?: Exercise[];
}> {
  return await getExercisesAction();
}
