/**
 * delete-exercise.ts のテスト
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// モックの設定
vi.mock("../../../db", () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/safe-action", () => ({
  authActionClient: {
    schema: vi.fn((schema) => ({
      action: vi.fn((handler) => {
        // authActionClientをバイパスしてハンドラを直接実行可能にする
        return async (input: any) => {
          const parsedInput = input;
          const ctx = { userId: "test-user-id" };
          return handler({ parsedInput, ctx });
        };
      }),
    })),
  },
}));

// モックした後にインポート
import { deleteExerciseSets, deleteCardioRecords } from "./delete-exercise";
import { db } from "../../../db";
import { revalidateTag } from "next/cache";

describe("delete-exercise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteExerciseSets", () => {
    describe("正常系: セット記録の削除", () => {
      it("セット記録を削除し、セッションに他の記録が残っている場合は削除しない", async () => {
        // Given: セット記録削除後、他の記録が残っている
        const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
        const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

        // カウントクエリ: sets=1, cardio=0（合計1なのでセッション削除しない）
        const mockSelectWhere1 = vi
          .fn()
          .mockResolvedValue([{ count: 1 }]); // sets count
        const mockSelectWhere2 = vi
          .fn()
          .mockResolvedValue([{ count: 0 }]); // cardio count
        const mockSelectFrom1 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere1 });
        const mockSelectFrom2 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere2 });

        let selectCallCount = 0;
        const mockSelect = vi.fn(() => {
          selectCallCount++;
          return { from: selectCallCount === 1 ? mockSelectFrom1 : mockSelectFrom2 };
        });

        (db.select as any) = mockSelect;
        (db.delete as any) = mockDelete;

        // When: セット記録を削除
        const result = await deleteExerciseSets({
          sessionId: "session-1",
          exerciseId: "exercise-1",
        });

        // Then: 削除成功、セッションは削除されない
        expect(result.success).toBe(true);
        expect(mockDeleteWhere).toHaveBeenCalledTimes(1); // sets削除のみ
        expect(revalidateTag).toHaveBeenCalledWith("history-bodyparts");
      });

      it("セット記録削除後、セッションが空になる場合はセッションも削除", async () => {
        // Given: セット記録削除後、セッションが空になる
        const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
        const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

        // カウントクエリ: sets=0, cardio=0（合計0なのでセッション削除）
        const mockSelectWhere1 = vi
          .fn()
          .mockResolvedValue([{ count: 0 }]); // sets count
        const mockSelectWhere2 = vi
          .fn()
          .mockResolvedValue([{ count: 0 }]); // cardio count
        const mockSelectFrom1 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere1 });
        const mockSelectFrom2 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere2 });

        let selectCallCount = 0;
        const mockSelect = vi.fn(() => {
          selectCallCount++;
          return { from: selectCallCount === 1 ? mockSelectFrom1 : mockSelectFrom2 };
        });

        (db.select as any) = mockSelect;
        (db.delete as any) = mockDelete;

        // When: セット記録を削除
        const result = await deleteExerciseSets({
          sessionId: "session-1",
          exerciseId: "exercise-1",
        });

        // Then: 削除成功、セッションも削除される
        expect(result.success).toBe(true);
        expect(mockDeleteWhere).toHaveBeenCalledTimes(2); // sets削除 + session削除
        expect(revalidateTag).toHaveBeenCalledWith("stats:total-days:test-user-id");
        expect(revalidateTag).toHaveBeenCalledWith("history-bodyparts");
        expect(revalidateTag).toHaveBeenCalledWith("history-session");
      });
    });
  });

  describe("deleteCardioRecords", () => {
    describe("正常系: 有酸素記録の削除", () => {
      it("有酸素記録を削除し、セッションに他の記録が残っている場合は削除しない", async () => {
        // Given: 有酸素記録削除後、他の記録が残っている
        const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
        const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

        // カウントクエリ: sets=0, cardio=1（合計1なのでセッション削除しない）
        const mockSelectWhere1 = vi
          .fn()
          .mockResolvedValue([{ count: 0 }]); // sets count
        const mockSelectWhere2 = vi
          .fn()
          .mockResolvedValue([{ count: 1 }]); // cardio count
        const mockSelectFrom1 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere1 });
        const mockSelectFrom2 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere2 });

        let selectCallCount = 0;
        const mockSelect = vi.fn(() => {
          selectCallCount++;
          return { from: selectCallCount === 1 ? mockSelectFrom1 : mockSelectFrom2 };
        });

        (db.select as any) = mockSelect;
        (db.delete as any) = mockDelete;

        // When: 有酸素記録を削除
        const result = await deleteCardioRecords({
          sessionId: "session-1",
          exerciseId: "cardio-1",
        });

        // Then: 削除成功、セッションは削除されない
        expect(result.success).toBe(true);
        expect(mockDeleteWhere).toHaveBeenCalledTimes(1); // cardio削除のみ
        expect(revalidateTag).toHaveBeenCalledWith("history-bodyparts");
      });

      it("有酸素記録削除後、セッションが空になる場合はセッションも削除", async () => {
        // Given: 有酸素記録削除後、セッションが空になる
        const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
        const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

        // カウントクエリ: sets=0, cardio=0（合計0なのでセッション削除）
        const mockSelectWhere1 = vi
          .fn()
          .mockResolvedValue([{ count: 0 }]); // sets count
        const mockSelectWhere2 = vi
          .fn()
          .mockResolvedValue([{ count: 0 }]); // cardio count
        const mockSelectFrom1 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere1 });
        const mockSelectFrom2 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere2 });

        let selectCallCount = 0;
        const mockSelect = vi.fn(() => {
          selectCallCount++;
          return { from: selectCallCount === 1 ? mockSelectFrom1 : mockSelectFrom2 };
        });

        (db.select as any) = mockSelect;
        (db.delete as any) = mockDelete;

        // When: 有酸素記録を削除
        const result = await deleteCardioRecords({
          sessionId: "session-1",
          exerciseId: "cardio-1",
        });

        // Then: 削除成功、セッションも削除される
        expect(result.success).toBe(true);
        expect(mockDeleteWhere).toHaveBeenCalledTimes(2); // cardio削除 + session削除
        expect(revalidateTag).toHaveBeenCalledWith("stats:total-days:test-user-id");
        expect(revalidateTag).toHaveBeenCalledWith("history-bodyparts");
        expect(revalidateTag).toHaveBeenCalledWith("history-session");
      });
    });

    describe("境界値: セットのみ残っている場合", () => {
      it("有酸素削除後、セットが1つ残っている場合はセッション削除しない", async () => {
        // Given: 有酸素削除後、セットが1つ残っている
        const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
        const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

        // カウントクエリ: sets=1, cardio=0（合計1なのでセッション削除しない）
        const mockSelectWhere1 = vi
          .fn()
          .mockResolvedValue([{ count: 1 }]); // sets count
        const mockSelectWhere2 = vi
          .fn()
          .mockResolvedValue([{ count: 0 }]); // cardio count
        const mockSelectFrom1 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere1 });
        const mockSelectFrom2 = vi
          .fn()
          .mockReturnValue({ where: mockSelectWhere2 });

        let selectCallCount = 0;
        const mockSelect = vi.fn(() => {
          selectCallCount++;
          return { from: selectCallCount === 1 ? mockSelectFrom1 : mockSelectFrom2 };
        });

        (db.select as any) = mockSelect;
        (db.delete as any) = mockDelete;

        // When: 有酸素記録を削除
        const result = await deleteCardioRecords({
          sessionId: "session-1",
          exerciseId: "cardio-1",
        });

        // Then: セッション削除されない
        expect(result.success).toBe(true);
        expect(mockDeleteWhere).toHaveBeenCalledTimes(1); // cardio削除のみ
      });
    });
  });
});
