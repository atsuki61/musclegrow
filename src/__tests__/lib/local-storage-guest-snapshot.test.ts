import { describe, expect, it } from "vitest";
import {
  getGuestExercises,
  getGuestExercisesSnapshot,
} from "@/lib/local-storage-guest";
import type { Exercise } from "@/types/workout";

describe("getGuestExercises snapshot stability", () => {
  const base: Exercise[] = [
    {
      id: "1",
      name: "Bench",
      bodyPart: "chest",
      tier: "initial",
      isBig3: false,
    },
  ];

  it("returns a new array reference on each uncached call with same input", () => {
    const first = getGuestExercises(base);
    const second = getGuestExercises(base);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it("returns the same array reference when snapshot cache is valid", () => {
    const first = getGuestExercisesSnapshot(base);
    const second = getGuestExercisesSnapshot(base);

    expect(first).toEqual(second);
    expect(first).toBe(second);
  });
});
