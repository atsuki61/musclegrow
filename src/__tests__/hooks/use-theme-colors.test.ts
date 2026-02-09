import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useThemeColors } from "@/hooks/use-theme-colors";
import * as ThemeProvider from "@/components/theme-provider";

// useColorThemeをモック
vi.mock("@/components/theme-provider", () => ({
  useColorTheme: vi.fn(),
}));

describe("useThemeColors", () => {
  let getComputedStyleMock: ReturnType<typeof vi.fn>;
  let getPropertyValueMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // getComputedStyleのモックを設定
    getPropertyValueMock = vi.fn();
    getComputedStyleMock = vi.fn(() => ({
      getPropertyValue: getPropertyValueMock,
    }));

    // グローバルのgetComputedStyleを置き換え
    global.getComputedStyle = getComputedStyleMock as typeof getComputedStyle;

    // デフォルトのuseColorThemeの戻り値
    vi.mocked(ThemeProvider.useColorTheme).mockReturnValue({
      color: "orange",
      setColor: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("正常系", () => {
    it("CSS変数が存在する場合、var(--primary)に更新される", async () => {
      // Given: CSS変数が正しく設定されている
      getPropertyValueMock.mockReturnValue("oklch(0.705 0.213 47.604)");

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: useEffectが実行されてCSS変数ラッパーに更新される
      await waitFor(() => {
        expect(result.current.primary).toBe("var(--primary)");
      });
    });

    it("colorが変更されたときにuseEffectが再実行される", async () => {
      // Given: 初期カラーはオレンジ
      getPropertyValueMock.mockReturnValue("oklch(0.705 0.213 47.604)");
      const mockSetColor = vi.fn();
      vi.mocked(ThemeProvider.useColorTheme).mockReturnValue({
        color: "orange",
        setColor: mockSetColor,
      });

      const { result, rerender } = renderHook(() => useThemeColors());

      await waitFor(() => {
        expect(result.current.primary).toBe("var(--primary)");
      });

      // When: カラーをblueに変更
      getPropertyValueMock.mockReturnValue("oklch(0.55 0.22 250)");
      vi.mocked(ThemeProvider.useColorTheme).mockReturnValue({
        color: "blue",
        setColor: mockSetColor,
      });

      rerender();

      // Then: useEffectが再実行されてgetComputedStyleが呼ばれる
      await waitFor(() => {
        expect(getComputedStyleMock).toHaveBeenCalled();
      });
    });

    it("getComputedStyleとgetPropertyValueが正しく呼び出される", async () => {
      // Given: CSS変数が設定されている
      getPropertyValueMock.mockReturnValue("oklch(0.705 0.213 47.604)");

      // When: フックを呼び出す
      renderHook(() => useThemeColors());

      // Then: document.documentElementに対してgetComputedStyleが呼ばれる
      await waitFor(() => {
        expect(getComputedStyleMock).toHaveBeenCalledWith(
          document.documentElement
        );
        expect(getPropertyValueMock).toHaveBeenCalledWith("--primary");
      });
    });

    it("複数のカラーテーマに対応できる", async () => {
      // Given: 異なるカラーテーマを順番にテスト
      const colors = [
        { name: "orange", value: "oklch(0.705 0.213 47.604)" },
        { name: "blue", value: "oklch(0.55 0.22 250)" },
        { name: "green", value: "oklch(0.65 0.18 145)" },
      ];

      for (const { name, value } of colors) {
        // When: 各カラーでフックを呼び出す
        getPropertyValueMock.mockReturnValue(value);
        vi.mocked(ThemeProvider.useColorTheme).mockReturnValue({
          color: name,
          setColor: vi.fn(),
        });

        const { result } = renderHook(() => useThemeColors());

        // Then: CSS変数ラッパーが返される
        await waitFor(() => {
          expect(result.current.primary).toBe("var(--primary)");
        });
      }
    });
  });

  describe("異常系・エッジケース", () => {
    it("CSS変数が空文字の場合、初期値のままになる", async () => {
      // Given: CSS変数が空文字
      getPropertyValueMock.mockReturnValue("");

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: 初期値が維持される
      await waitFor(() => {
        expect(result.current.primary).toBe("oklch(0.705 0.213 47.604)");
      });
    });

    it("CSS変数が空白文字のみの場合、初期値のままになる", async () => {
      // Given: CSS変数が空白文字のみ
      getPropertyValueMock.mockReturnValue("   ");

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: 初期値が維持される（trimで空文字になるため）
      await waitFor(() => {
        expect(result.current.primary).toBe("oklch(0.705 0.213 47.604)");
      });
    });

    it("getPropertyValueがnullを返す場合でも正常に動作する", async () => {
      // Given: getPropertyValueがnullを返す
      getPropertyValueMock.mockReturnValue(null);

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: 初期値が維持される
      expect(result.current.primary).toBe("oklch(0.705 0.213 47.604)");
    });

    it("getPropertyValueがundefinedを返す場合でも正常に動作する", async () => {
      // Given: getPropertyValueがundefinedを返す
      getPropertyValueMock.mockReturnValue(undefined);

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: 初期値が維持される
      expect(result.current.primary).toBe("oklch(0.705 0.213 47.604)");
    });

    it("getComputedStyleが例外をスローしても正常に動作する", () => {
      // Given: getComputedStyleが例外をスロー
      getComputedStyleMock.mockImplementation(() => {
        throw new Error("getComputedStyle failed");
      });

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: エラーハンドリングされ、初期値が維持される
      expect(result.current.primary).toBe("oklch(0.705 0.213 47.604)");
    });

    it("useColorThemeがnullカラーを返しても正常に動作する", async () => {
      // Given: colorがnull
      vi.mocked(ThemeProvider.useColorTheme).mockReturnValue({
        color: null as unknown as string,
        setColor: vi.fn(),
      });
      getPropertyValueMock.mockReturnValue("oklch(0.705 0.213 47.604)");

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: useEffectは実行されるが、エラーは発生しない
      await waitFor(() => {
        expect(result.current.primary).toBeDefined();
      });
    });
  });

  describe("境界値", () => {
    it("非常に長いCSS変数値でも正常に処理される", async () => {
      // Given: 非常に長いCSS変数値
      const longValue = "oklch(".padEnd(1000, "0") + ")";
      getPropertyValueMock.mockReturnValue(longValue);

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: var(--primary)に更新される
      await waitFor(() => {
        expect(result.current.primary).toBe("var(--primary)");
      });
    });

    it("特殊文字を含むCSS変数値でも正常に処理される", async () => {
      // Given: 特殊文字を含む値
      getPropertyValueMock.mockReturnValue("oklch(0.5 0.2 180) /* comment */");

      // When: フックを呼び出す
      const { result } = renderHook(() => useThemeColors());

      // Then: var(--primary)に更新される
      await waitFor(() => {
        expect(result.current.primary).toBe("var(--primary)");
      });
    });
  });

  describe("パフォーマンス", () => {
    it("colorが変更されない限りuseEffectは再実行されない", async () => {
      // Given: 初期状態
      getPropertyValueMock.mockReturnValue("oklch(0.705 0.213 47.604)");
      const mockSetColor = vi.fn();
      vi.mocked(ThemeProvider.useColorTheme).mockReturnValue({
        color: "orange",
        setColor: mockSetColor,
      });

      const { rerender } = renderHook(() => useThemeColors());

      await waitFor(() => {
        expect(getComputedStyleMock).toHaveBeenCalledTimes(1);
      });

      // When: colorを変更せずに再レンダリング
      rerender();
      rerender();
      rerender();

      // Then: useEffectは再実行されない（初回の1回のみ）
      expect(getComputedStyleMock).toHaveBeenCalledTimes(1);
    });
  });
});
