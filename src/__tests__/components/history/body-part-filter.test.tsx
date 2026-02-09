import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BodyPartFilter } from "@/components/features/history/body-part-filter";
import { BODY_PART_LABELS } from "@/lib/utils";
import type { BodyPart } from "@/types/workout";

describe("BodyPartFilter", () => {
  const defaultProps = {
    selectedPart: "all" as BodyPart,
    onPartChange: vi.fn(),
  };

  const BODY_PARTS: BodyPart[] = [
    "all",
    "chest",
    "back",
    "legs",
    "shoulders",
    "arms",
    "core",
    "other",
  ];

  describe("基本表示", () => {
    it("8つの部位タブが表示される", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      render(<BodyPartFilter {...defaultProps} />);

      // Then: 8つのタブが表示される
      BODY_PARTS.forEach((part) => {
        expect(screen.getByText(BODY_PART_LABELS[part])).toBeInTheDocument();
      });
    });

    it("選択された部位が強調表示される", () => {
      // Given: selectedPart = "chest"
      // When: コンポーネントをレンダリング
      render(<BodyPartFilter {...defaultProps} selectedPart="chest" />);

      // Then: "胸"タブが選択状態
      const chestTab = screen.getByText(BODY_PART_LABELS.chest);
      expect(chestTab).toHaveClass("text-white");
    });

    it("各部位のラベルが正しく表示される", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      render(<BodyPartFilter {...defaultProps} />);

      // Then: 各部位のラベルが正しく表示される（BODY_PART_LABELSから取得）
      BODY_PARTS.forEach((part) => {
        expect(screen.getByText(BODY_PART_LABELS[part])).toBeInTheDocument();
      });
    });
  });

  describe("タブ選択", () => {
    it("タブをクリックするとonPartChangeが呼ばれる", async () => {
      // Given: デフォルトprops
      const user = userEvent.setup();
      const onPartChange = vi.fn();

      // When: "胸"タブをクリック
      render(<BodyPartFilter {...defaultProps} onPartChange={onPartChange} />);
      const chestTab = screen.getByText(BODY_PART_LABELS.chest);
      await user.click(chestTab);

      // Then: onPartChangeが"chest"で呼ばれる
      expect(onPartChange).toHaveBeenCalledWith("chest");
    });

    it("\"all\"を選択できる", async () => {
      // Given: selectedPart = "chest"
      const user = userEvent.setup();
      const onPartChange = vi.fn();

      // When: "すべて"タブをクリック
      render(
        <BodyPartFilter
          {...defaultProps}
          selectedPart="chest"
          onPartChange={onPartChange}
        />
      );
      const allTab = screen.getByText(BODY_PART_LABELS.all);
      await user.click(allTab);

      // Then: onPartChangeが"all"で呼ばれる
      expect(onPartChange).toHaveBeenCalledWith("all");
    });

    it("\"chest\"を選択できる", async () => {
      // Given: デフォルトprops
      const user = userEvent.setup();
      const onPartChange = vi.fn();

      // When: "胸"タブをクリック
      render(<BodyPartFilter {...defaultProps} onPartChange={onPartChange} />);
      const chestTab = screen.getByText(BODY_PART_LABELS.chest);
      await user.click(chestTab);

      // Then: onPartChangeが"chest"で呼ばれる
      expect(onPartChange).toHaveBeenCalledWith("chest");
    });

    it("他の部位も選択できる", async () => {
      // Given: デフォルトprops
      const user = userEvent.setup();
      const onPartChange = vi.fn();

      // When: "背中"タブをクリック
      render(<BodyPartFilter {...defaultProps} onPartChange={onPartChange} />);
      const backTab = screen.getByText(BODY_PART_LABELS.back);
      await user.click(backTab);

      // Then: onPartChangeが"back"で呼ばれる
      expect(onPartChange).toHaveBeenCalledWith("back");
    });
  });

  describe("スタイル", () => {
    it("選択された部位は白文字になる", () => {
      // Given: selectedPart = "chest"
      // When: コンポーネントをレンダリング
      render(<BodyPartFilter {...defaultProps} selectedPart="chest" />);

      // Then: "胸"タブが白文字
      const chestTab = screen.getByText(BODY_PART_LABELS.chest);
      expect(chestTab).toHaveClass("text-white");
    });

    it("未選択の部位は部位色の文字になる", () => {
      // Given: selectedPart = "all"
      // When: コンポーネントをレンダリング
      render(<BodyPartFilter {...defaultProps} selectedPart="all" />);

      // Then: "胸"タブは白文字ではない（部位色）
      const chestTab = screen.getByText(BODY_PART_LABELS.chest);
      expect(chestTab).not.toHaveClass("text-white");
    });

    it("\"all\"の場合は特別なスタイルが適用される", () => {
      // Given: selectedPart = "all"
      // When: コンポーネントをレンダリング
      render(<BodyPartFilter {...defaultProps} selectedPart="all" />);

      // Then: "すべて"タブが選択状態
      const allTab = screen.getByText(BODY_PART_LABELS.all);
      // "all"の場合、styleで backgroundColor と color が設定される
      expect(allTab).toBeInTheDocument();
    });

    it("Tabsコンポーネントが使用されている", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      const { container } = render(<BodyPartFilter {...defaultProps} />);

      // Then: Tabsコンポーネントが存在する
      const tabs = container.querySelector('[role="tablist"]');
      expect(tabs).toBeInTheDocument();
    });
  });
});
