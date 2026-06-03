import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteGuestCustomExercise,
  getGuestExercises,
  isGuestCustomExercise,
  renameGuestCustomExercise,
  saveGuestCustomExercise,
  toggleGuestExerciseVisibility,
} from "@/lib/local-storage-guest";
import type { Exercise } from "@/types/workout";

describe("local-storage-guest", () => {
  const customExercise: Exercise = {
    id: "guest-custom-exercise",
    name: "間違えて作った種目",
    bodyPart: "chest",
    tier: "custom",
    isBig3: false,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("ゲストのカスタム種目を削除すると、種目本体と表示設定を消す", () => {
    saveGuestCustomExercise(customExercise);
    toggleGuestExerciseVisibility(customExercise.id, true);

    expect(isGuestCustomExercise(customExercise.id)).toBe(true);

    const deleted = deleteGuestCustomExercise(customExercise.id);
    const exercises = getGuestExercises([]);

    expect(deleted).toBe(true);
    expect(isGuestCustomExercise(customExercise.id)).toBe(false);
    expect(exercises).toHaveLength(0);
    expect(localStorage.getItem("musclegrow_guest_settings")).toBe("{}");
  });

  it("通常種目IDを削除しようとした場合はfalseを返す", () => {
    const deleted = deleteGuestCustomExercise("seed-exercise");

    expect(deleted).toBe(false);
  });

  it("ゲストのカスタム種目名を変更できる", () => {
    saveGuestCustomExercise(customExercise);

    const renamedExercise = renameGuestCustomExercise(
      customExercise.id,
      " 正しい種目名 "
    );
    const exercises = getGuestExercises([]);

    expect(renamedExercise?.name).toBe("正しい種目名");
    expect(exercises[0].name).toBe("正しい種目名");
  });
});
