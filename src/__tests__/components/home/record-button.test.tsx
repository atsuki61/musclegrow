import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordButton } from "@/components/features/home/record-button";

describe("RecordButton", () => {
  describe("基本表示", () => {
    it("ボタンが表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      render(<RecordButton />);

      // Then: リンクが表示される
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("「トレーニングを記録」テキストが表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      render(<RecordButton />);

      // Then: テキストが表示される
      expect(screen.getByText("トレーニングを記録")).toBeInTheDocument();
    });
  });

  describe("リンク機能", () => {
    it("/recordへのリンクが正しく設定されている", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      render(<RecordButton />);

      // Then: href属性が/recordになっている
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/record");
    });
  });

  describe("アイコン表示", () => {
    it("Plusアイコンが表示される", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      const { container } = render(<RecordButton />);

      // Then: SVGアイコンが表示される
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("スタイル", () => {
    it("ボタンに適切なクラスが適用されている", () => {
      // Given: なし
      // When: コンポーネントをレンダリング
      render(<RecordButton />);

      // Then: リンクに適切なクラスが適用されている
      const link = screen.getByRole("link");
      expect(link).toHaveClass("group", "rounded-2xl", "shadow-lg");
    });
  });
});
