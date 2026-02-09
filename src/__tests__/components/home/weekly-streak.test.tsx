import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklyStreak } from "@/components/features/home/weekly-streak";

describe("WeeklyStreak", () => {
  describe("基本表示", () => {
    it("「Weekly Streak」タイトルが表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      render(<WeeklyStreak />);

      // Then: タイトルが表示される
      expect(screen.getByText("Weekly Streak")).toBeInTheDocument();
    });

    it("7日分の曜日が表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      const { container } = render(<WeeklyStreak />);

      // Then: 7つの曜日インジケーターが存在する
      const dayElements = container.querySelectorAll(".flex.flex-col.items-center.gap-2");
      expect(dayElements).toHaveLength(7);
    });

    it("炎のアイコンが表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      const { container } = render(<WeeklyStreak />);

      // Then: SVGアイコンが表示される
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("曜日表示", () => {
    it("各曜日の最初の文字（M, T, W, T, F, S, S）が表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      render(<WeeklyStreak />);

      // Then: 各曜日の頭文字が表示される
      expect(screen.getByText("M")).toBeInTheDocument(); // Monday
      expect(screen.getAllByText("T")).toHaveLength(2); // Tuesday & Thursday
      expect(screen.getByText("W")).toBeInTheDocument(); // Wednesday
      expect(screen.getByText("F")).toBeInTheDocument(); // Friday
      expect(screen.getAllByText("S")).toHaveLength(2); // Saturday & Sunday
    });

    it("7つの円形インジケーターが表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      const { container } = render(<WeeklyStreak />);

      // Then: 7つの円形要素が存在する
      const circles = container.querySelectorAll(".w-8.h-8.rounded-full");
      expect(circles).toHaveLength(7);
    });
  });

  describe("完了状態", () => {
    it("完了した日にチェックマークが表示される（仮データ: 1, 3, 5）", () => {
      // Given: 仮データで completed = [1, 3, 5]
      // When: コンポーネントをレンダリング
      const { container } = render(<WeeklyStreak />);

      // Then: チェックマークが表示される（3つ）
      const checkmarks = Array.from(container.querySelectorAll(".w-8.h-8.rounded-full"))
        .filter((el) => el.textContent === "✓");
      expect(checkmarks).toHaveLength(3);
    });

    it("未完了の日はチェックマークがない", () => {
      // Given: 仮データで completed = [1, 3, 5]（0, 2, 4, 6は未完了）
      // When: コンポーネントをレンダリング
      const { container } = render(<WeeklyStreak />);

      // Then: 空の円が4つ存在する
      const emptyCircles = Array.from(container.querySelectorAll(".w-8.h-8.rounded-full"))
        .filter((el) => el.textContent === "");
      expect(emptyCircles).toHaveLength(4);
    });
  });

  describe("スタイル", () => {
    it("カードに適切なクラスが適用されている", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      const { container } = render(<WeeklyStreak />);

      // Then: カードに適切なクラスが適用されている
      const card = container.querySelector(".bg-card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("border", "rounded-2xl", "p-4", "shadow-sm");
    });
  });
});
