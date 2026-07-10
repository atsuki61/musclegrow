"use client";

/**
 * 記録画面の種目一覧 CRUD
 *
 * 責務:
 *   - 表示する種目リスト (exercises) の state 管理
 *   - 追加 / 非表示 / カスタム削除 / カスタム名変更
 *   - userId の有無で DB（Server Action）か localStorage かを切り替え
 * 入力: initialExercises（サーバーから渡される）, userId, onExerciseListChanged
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  deleteCustomExercise,
  renameCustomExercise,
  saveExercise,
} from "@/lib/api";
import { toggleExerciseVisibility } from "@/lib/actions/user-exercises";
import {
  deleteGuestCustomExercise,
  getGuestExercisesSnapshot,
  isGuestCustomExercise,
  renameGuestCustomExercise,
  saveGuestCustomExercise,
  subscribeGuestExercises,
  toggleGuestExerciseVisibility,
} from "@/lib/local-storage-guest";
import type { Exercise } from "@/types/workout";
import { toast } from "sonner";

interface UseRecordExercisesParams {
  initialExercises: Exercise[];
  onExerciseListChanged: () => void;
  userId: string | null | undefined;
}

function getExerciseListKey(exerciseList: Exercise[]): string {
  return exerciseList.map((exercise) => `${exercise.id}:${exercise.tier}`).join("|");
}

export function useRecordExercises({
  initialExercises,
  onExerciseListChanged,
  userId,
}: UseRecordExercisesParams) {
  const guestBaseExercises = useSyncExternalStore(
    subscribeGuestExercises,
    () =>
      userId
        ? initialExercises
        : getGuestExercisesSnapshot(initialExercises),
    () => initialExercises
  );

  const baseExercises = userId ? initialExercises : guestBaseExercises;
  const baseKey = getExerciseListKey(baseExercises);

  // --- 種目一覧 state（CRUD 後のローカル更新。base 変更時は base に戻す） ---
  const [localExercises, setLocalExercises] = useState<Exercise[] | null>(null);
  const [appliedBaseKey, setAppliedBaseKey] = useState(baseKey);

  if (baseKey !== appliedBaseKey) {
    setAppliedBaseKey(baseKey);
    setLocalExercises(null);
  }

  const exercises = localExercises ?? baseExercises;

  const setExercises = useCallback(
    (updater: Exercise[] | ((prev: Exercise[]) => Exercise[])) => {
      setLocalExercises((prevLocal) => {
        const current = prevLocal ?? baseExercises;
        return typeof updater === "function" ? updater(current) : updater;
      });
    },
    [baseExercises]
  );

  // --- リネーム Dialog の入力 state（renamingExercise が null なら Dialog 閉） ---
  const [renamingExercise, setRenamingExercise] = useState<Exercise | null>(
    null,
  );
  const [renameExerciseName, setRenameExerciseName] = useState("");
  const [renameExerciseError, setRenameExerciseError] = useState<string | null>(
    null,
  );

  const isCustomExerciseOwnedByCurrentUser = useCallback(
    (exercise: Exercise) => {
      if (userId) return exercise.userId === userId;
      return isGuestCustomExercise(exercise.id);
    },
    [userId],
  );

  // --- 種目追加（AddExerciseModal から呼ぶ） ---
  const handleAddExercise = useCallback(
    async (exercise: Exercise) => {
      let exerciseToAdd = exercise;

      // ログイン時はDBの表示設定、ゲスト時はlocalStorageの表示設定を更新する。
      if (userId) {
        if (exercise.tier === "custom") {
          const result = await saveExercise(userId, exercise);
          if (!result.success) {
            console.error("種目保存エラー:", result.error);
            toast.error("種目の保存に失敗しました");
            return;
          }
          exerciseToAdd = result.data ?? exercise;
        }

        await toggleExerciseVisibility(userId, exerciseToAdd.id, true);
      } else {
        toggleGuestExerciseVisibility(exerciseToAdd.id, true);
        if (exercise.tier === "custom") {
          saveGuestCustomExercise(exerciseToAdd);
        }
      }

      // 追加済み種目は記録画面に表示される tier として扱う。
      const newExercise = { ...exerciseToAdd, tier: "initial" as const };
      setExercises((prev) => {
        const exists = prev.some((item) => item.id === exerciseToAdd.id);
        if (exists) {
          return prev.map((item) =>
            item.id === exerciseToAdd.id ? newExercise : item,
          );
        }
        return [...prev, newExercise];
      });

      onExerciseListChanged();
      toast.success("種目をリストに追加しました");
    },
    [onExerciseListChanged, userId],
  );

  // --- カスタム種目の完全削除 ---
  const handleDeleteCustomExercise = useCallback(
    async (exercise: Exercise) => {
      if (userId) {
        const result = await deleteCustomExercise(userId, exercise.id);
        if (!result.success) {
          toast.error(result.error ?? "カスタム種目の削除に失敗しました");
          return;
        }
      } else if (!deleteGuestCustomExercise(exercise.id)) {
        toast.error("削除できるカスタム種目が見つかりません");
        return;
      }

      setExercises((prev) => prev.filter((item) => item.id !== exercise.id));
      toast.success("カスタム種目を削除しました");
    },
    [userId],
  );

  // --- リストから非表示（編集モードのタップ） ---
  // カスタム種目は非表示ではなく handleDeleteCustomExercise へ委譲
  const handleRemoveExercise = useCallback(
    async (exercise: Exercise) => {
      // 自分で作成したカスタム種目は非表示ではなく完全削除する。
      if (isCustomExerciseOwnedByCurrentUser(exercise)) {
        await handleDeleteCustomExercise(exercise);
        return;
      }

      if (userId) {
        await toggleExerciseVisibility(userId, exercise.id, false);
      } else {
        // 古いゲストデータにカスタム種目が混ざっていても削除できるようにする。
        const deletedCustomExercise = deleteGuestCustomExercise(exercise.id);
        if (deletedCustomExercise) {
          setExercises((prev) =>
            prev.filter((item) => item.id !== exercise.id),
          );
          toast.success("カスタム種目を削除しました");
          return;
        }

        toggleGuestExerciseVisibility(exercise.id, false);
      }

      setExercises((prev) =>
        prev.map((item) =>
          item.id === exercise.id ? { ...item, tier: "selectable" } : item,
        ),
      );
      toast.success("リストから削除しました", {
        description: "種目追加画面からいつでも元に戻せます",
      });
    },
    [handleDeleteCustomExercise, isCustomExerciseOwnedByCurrentUser, userId],
  );

  // リネーム Dialog 操作
  const handleOpenRenameCustomExercise = useCallback((exercise: Exercise) => {
    setRenamingExercise(exercise); //リネームDialog内の種目
    setRenameExerciseName(exercise.name); //リネームDialog内の種目名
    setRenameExerciseError(null); //リネームDialog内のエラー
  }, []);

  const handleCloseRenameCustomExercise = useCallback(() => {
    setRenamingExercise(null);
    setRenameExerciseName("");
    setRenameExerciseError(null);
  }, []);

  const handleRenameExerciseNameChange = useCallback((name: string) => {
    setRenameExerciseName(name);
    setRenameExerciseError(null);
  }, []);

  const handleRenameCustomExercise = useCallback(async () => {
    if (!renamingExercise) return;

    // 空文字と変更なしはAPI/localStorage更新前にここで止める。
    const nextName = renameExerciseName.trim();
    if (!nextName) {
      setRenameExerciseError("種目名を入力してください");
      return;
    }

    if (nextName === renamingExercise.name) {
      handleCloseRenameCustomExercise();
      return;
    }

    if (userId) {
      const result = await renameCustomExercise(
        userId,
        renamingExercise.id,
        nextName,
      );
      if (!result.success || !result.data) {
        setRenameExerciseError(
          result.error ?? "カスタム種目名の変更に失敗しました",
        );
        return;
      }

      setExercises((prev) =>
        prev.map((exercise) =>
          exercise.id === renamingExercise.id
            ? { ...exercise, ...result.data, tier: exercise.tier }
            : exercise,
        ),
      );
    } else {
      const renamedExercise = renameGuestCustomExercise(
        renamingExercise.id,
        nextName,
      );
      if (!renamedExercise) {
        setRenameExerciseError("カスタム種目名の変更に失敗しました");
        return;
      }

      setExercises((prev) =>
        prev.map((exercise) =>
          exercise.id === renamingExercise.id
            ? { ...exercise, name: renamedExercise.name }
            : exercise,
        ),
      );
    }

    toast.success("カスタム種目名を変更しました");
    handleCloseRenameCustomExercise();
  }, [
    handleCloseRenameCustomExercise,
    renameExerciseName,
    renamingExercise,
    userId,
  ]);

  return {
    exercises, //種目一覧
    handleAddExercise, //種目追加
    handleCloseRenameCustomExercise, //リネームDialog閉じる
    handleDeleteCustomExercise, //カスタム種目削除
    handleOpenRenameCustomExercise, //リネームDialog開く
    handleRemoveExercise, //リストから非表示
    handleRenameCustomExercise, //カスタム種目名変更
    handleRenameExerciseNameChange, //リネームDialog内の種目名変更
    isCustomExerciseOwnedByCurrentUser, //カスタム種目の所有者判定
    renameExerciseError, //リネームDialog内のエラー
    renameExerciseName, //リネームDialog内の種目名
    renamingExercise, //リネームDialog内の種目
  };
}
