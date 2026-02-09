import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLastTrainedDates } from "@/hooks/use-last-trained";
import * as lastTrainedLib from "@/lib/last-trained";
import * as workoutSessionsActions from "@/lib/actions/workout-sessions";
import * as AuthSessionContext from "@/lib/auth-session-context";

// モック
vi.mock("@/lib/last-trained");
vi.mock("@/lib/actions/workout-sessions");
vi.mock("@/lib/auth-session-context");

describe("useLastTrainedDates", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    // デフォルトのモック設定
    vi.mocked(AuthSessionContext.useAuthSession).mockReturnValue({
      userId: mockUserId,
    });

    vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({});
    vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
      success: true,
      data: {},
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("正常系", () => {
    it("初期状態では空のオブジェクトが返される", () => {
      // Given: モックが空データを返す
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({});

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: 初期状態は空オブジェクト
      expect(result.current.lastTrainedDates).toEqual({});
    });

    it("ローカルストレージからデータを取得できる", async () => {
      // Given: ローカルストレージに最終トレーニング日がある
      const localDates = {
        "ex-1": new Date("2024-01-15"),
        "ex-2": new Date("2024-01-20"),
      };
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue(localDates);

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: ローカルのデータが取得される
      await waitFor(() => {
        expect(result.current.lastTrainedDates).toEqual(localDates);
      });
    });

    it("DBからデータを取得できる（ログイン時）", async () => {
      // Given: ローカルは空、DBにデータがある
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({});
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: {
          "ex-1": "2024-01-15T00:00:00.000Z",
          "ex-2": "2024-01-20T00:00:00.000Z",
        },
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: DBのデータが取得される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-15T00:00:00.000Z")
        );
        expect(result.current.lastTrainedDates["ex-2"]).toEqual(
          new Date("2024-01-20T00:00:00.000Z")
        );
      });
    });

    it("ローカルとDBのデータがマージされる（DBの方が新しい場合）", async () => {
      // Given: ローカルとDBの両方にデータがある、DBの方が新しい
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-15"),
      });
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: {
          "ex-1": "2024-01-20T00:00:00.000Z", // より新しい
        },
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: DBの新しい日付が採用される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-20T00:00:00.000Z")
        );
      });
    });

    it("ローカルとDBのデータがマージされる（ローカルの方が新しい場合）", async () => {
      // Given: ローカルとDBの両方にデータがある、ローカルの方が新しい
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-25"),
      });
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: {
          "ex-1": "2024-01-20T00:00:00.000Z", // より古い
        },
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: ローカルの新しい日付が維持される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-25")
        );
      });
    });

    it("異なる種目のデータがマージされる", async () => {
      // Given: ローカルとDBで異なる種目のデータがある
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-15"),
      });
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: {
          "ex-2": "2024-01-20T00:00:00.000Z",
        },
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: 両方の種目が含まれる
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-15")
        );
        expect(result.current.lastTrainedDates["ex-2"]).toEqual(
          new Date("2024-01-20T00:00:00.000Z")
        );
      });
    });

    it("refreshを呼び出すとデータが再取得される", async () => {
      // Given: 初期データ
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-15"),
      });

      const { result } = renderHook(() => useLastTrainedDates());

      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toBeDefined();
      });

      // When: データを更新してrefreshを呼び出す
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-20"),
      });

      await result.current.refresh();

      // Then: 新しいデータが取得される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-20")
        );
      });
    });

    it("複数の種目で最新の日付が正しく管理される", async () => {
      // Given: 複数種目のデータがローカルとDBに分散
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-15"),
        "ex-2": new Date("2024-01-18"),
        "ex-3": new Date("2024-01-20"),
      });
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: {
          "ex-1": "2024-01-16T00:00:00.000Z", // より新しい
          "ex-2": "2024-01-17T00:00:00.000Z", // より古い
          "ex-4": "2024-01-22T00:00:00.000Z", // 新規
        },
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: 各種目で最新の日付が採用される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-16T00:00:00.000Z")
        ); // DBが新しい
        expect(result.current.lastTrainedDates["ex-2"]).toEqual(
          new Date("2024-01-18")
        ); // ローカルが新しい
        expect(result.current.lastTrainedDates["ex-3"]).toEqual(
          new Date("2024-01-20")
        ); // ローカルのみ
        expect(result.current.lastTrainedDates["ex-4"]).toEqual(
          new Date("2024-01-22T00:00:00.000Z")
        ); // DBのみ
      });
    });
  });

  describe("異常系・エッジケース", () => {
    it("ローカルストレージが空の場合、空オブジェクトが返される", async () => {
      // Given: ローカルとDBの両方が空
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({});
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: {},
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: 空オブジェクトが返される
      await waitFor(() => {
        expect(result.current.lastTrainedDates).toEqual({});
      });
    });

    it("userIdがnullの場合、DBアクセスをスキップする", async () => {
      // Given: ゲストモード（userIdがnull）
      vi.mocked(AuthSessionContext.useAuthSession).mockReturnValue({
        userId: null,
      });
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-15"),
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: ローカルのデータのみが返される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-15")
        );
      });

      // DBアクセスが呼ばれていないことを確認
      expect(workoutSessionsActions.getLastTrainedDatesFromDB).not.toHaveBeenCalled();
    });

    it("DB取得でエラーが発生してもローカルデータは返される", async () => {
      // Given: ローカルにデータがあり、DB取得でエラー
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-15"),
      });
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockRejectedValue(
        new Error("Database error")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: ローカルデータが返される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-15")
        );
      });

      // エラーがログ出力されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        "最終トレーニング日取得エラー(DB)",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("DBレスポンスがsuccessだがdataがnullの場合、ローカルデータが使われる", async () => {
      // Given: ローカルにデータがあり、DBはsuccessだがdataがnull
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-15"),
      });
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: undefined,
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: ローカルデータが返される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-15")
        );
      });
    });

    it("DBレスポンスがsuccessがfalseの場合、ローカルデータが使われる", async () => {
      // Given: ローカルにデータがあり、DBはsuccess: false
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": new Date("2024-01-15"),
      });
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: false,
        error: "Database error",
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: ローカルデータが返される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-15")
        );
      });
    });

    it("ローカルとDBの両方でエラーが発生しても空オブジェクトが返される", async () => {
      // Given: ローカルが空、DBがエラー
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({});
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockRejectedValue(
        new Error("Database error")
      );

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: 空オブジェクトが返される
      await waitFor(() => {
        expect(result.current.lastTrainedDates).toEqual({});
      });

      consoleSpy.mockRestore();
    });

    it("日付文字列の変換が正しく行われる", async () => {
      // Given: DBが日付文字列を返す
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({});
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: {
          "ex-1": "2024-01-15T12:30:45.123Z",
        },
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: Dateオブジェクトに変換される
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toBeInstanceOf(Date);
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-15T12:30:45.123Z")
        );
      });
    });
  });

  describe("境界値", () => {
    it("同じ日付の場合、DBの値が優先される", async () => {
      // Given: ローカルとDBで同じ日付
      const sameDate = new Date("2024-01-15T00:00:00.000Z");
      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue({
        "ex-1": sameDate,
      });
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: {
          "ex-1": "2024-01-15T00:00:00.000Z",
        },
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: DBの値が優先される（>= 比較のため）
      await waitFor(() => {
        expect(result.current.lastTrainedDates["ex-1"]).toEqual(
          new Date("2024-01-15T00:00:00.000Z")
        );
      });
    });

    it("非常に多くの種目がある場合でも正常に動作する", async () => {
      // Given: 100種目のデータ
      const localDates: Record<string, Date> = {};
      const dbDates: Record<string, string> = {};

      for (let i = 0; i < 100; i++) {
        localDates[`ex-${i}`] = new Date(`2024-01-${(i % 30) + 1}`);
        dbDates[`ex-${i}`] = `2024-01-${((i + 1) % 30) + 1}T00:00:00.000Z`;
      }

      vi.mocked(lastTrainedLib.getLastTrainedDates).mockReturnValue(localDates);
      vi.mocked(workoutSessionsActions.getLastTrainedDatesFromDB).mockResolvedValue({
        success: true,
        data: dbDates,
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useLastTrainedDates());

      // Then: 全ての種目が正しくマージされる
      await waitFor(() => {
        expect(Object.keys(result.current.lastTrainedDates).length).toBe(100);
      });
    });
  });
});
