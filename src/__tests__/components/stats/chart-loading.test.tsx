import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartLoading } from "@/components/features/stats/chart-loading";

describe("ChartLoading", () => {
  describe("基本表示", () => {
    it("「読み込み中...」テキストが表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      render(<ChartLoading />);

      // Then: テキストが表示される
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    it("コンテナが表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      const { container } = render(<ChartLoading />);

      // Then: コンテナが存在する
      const loadingContainer = container.querySelector("div");
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe("スタイル", () => {
    it("適切なクラスが適用されている", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      const { container } = render(<ChartLoading />);

      // Then: 適切なクラスが適用されている
      const loadingContainer = container.querySelector("div");
      expect(loadingContainer).toHaveClass("flex", "items-center", "justify-center", "h-[300px]");
    });
  });
});
