import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TotalDaysBadge } from "@/components/features/home/total-days-badge";

describe("TotalDaysBadge", () => {
  describe("基本表示", () => {
    it("日数が正しく表示される", () => {
      // Given: 10日のデータ
      const days = 10;

      // When: コンポーネントをレンダリング
      render(<TotalDaysBadge days={days} />);

      // Then: 日数が表示される
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("炎のアイコンが表示される", () => {
      // Given: 任意の日数
      const days = 5;

      // When: コンポーネントをレンダリング
      const { container } = render(<TotalDaysBadge days={days} />);

      // Then: 炎のアイコン（svg）が表示される
      const flameIcon = container.querySelector("svg");
      expect(flameIcon).toBeInTheDocument();
    });

    it("バッジのスタイルが適用される", () => {
      // Given: 任意の日数
      const days = 7;

      // When: コンポーネントをレンダリング
      const { container } = render(<TotalDaysBadge days={days} />);

      // Then: バッジのコンテナが存在し、適切なクラスが適用されている
      const badge = container.querySelector(".bg-card\\/50");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("border", "rounded-full", "px-3", "py-1.5", "shadow-sm");
    });
  });

  describe("境界値", () => {
    it("0日の場合も正しく表示される", () => {
      // Given: 0日
      const days = 0;

      // When: コンポーネントをレンダリング
      render(<TotalDaysBadge days={days} />);

      // Then: 0が表示される
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("1日の場合も正しく表示される", () => {
      // Given: 1日
      const days = 1;

      // When: コンポーネントをレンダリング
      render(<TotalDaysBadge days={days} />);

      // Then: 1が表示される
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("大きな数値（1000日）も正しく表示される", () => {
      // Given: 1000日
      const days = 1000;

      // When: コンポーネントをレンダリング
      render(<TotalDaysBadge days={days} />);

      // Then: 1000が表示される
      expect(screen.getByText("1000")).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("tabular-numsクラスで数字が等幅表示される", () => {
      // Given: 任意の日数
      const days = 123;

      // When: コンポーネントをレンダリング
      const { container } = render(<TotalDaysBadge days={days} />);

      // Then: tabular-numsクラスが適用されている
      const numberElement = container.querySelector(".tabular-nums");
      expect(numberElement).toBeInTheDocument();
      expect(numberElement).toHaveTextContent("123");
    });
  });
});
