import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateSelector } from "@/components/features/record/date-selector";
import { subDays, addDays, format } from "date-fns";

describe("DateSelector", () => {
  const mockToday = new Date(2024, 0, 15); // 2024-01-15 (月曜日)

  beforeEach(() => {
    // 現在日時をモック
    vi.setSystemTime(mockToday);
  });

  describe("基本表示", () => {
    it("日付が表示される", () => {
      // Given: デフォルトprops（今日の日付）
      // When: コンポーネントをレンダリング
      render(<DateSelector />);

      // Then: 日付が表示される
      expect(screen.getByText(/2024\/1\/15/)).toBeInTheDocument();
    });

    it("前日ボタンが表示される", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      render(<DateSelector />);

      // Then: 前日ボタンが表示される（ChevronLeftアイコン）
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("翌日ボタンが表示される", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      render(<DateSelector />);

      // Then: 翌日ボタンが表示される（ChevronRightアイコン）
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(3); // 前日、日付、翌日
    });

    it("カレンダーアイコンが表示される", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      const { container } = render(<DateSelector />);

      // Then: SVGアイコンが表示される
      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("日付表示", () => {
    it("yyyy/M/d形式で表示される", () => {
      // Given: 2024年1月15日
      const date = new Date(2024, 0, 15);

      // When: コンポーネントをレンダリング
      render(<DateSelector date={date} />);

      // Then: "2024/1/15"形式で表示される
      expect(screen.getByText(/2024\/1\/15/)).toBeInTheDocument();
    });

    it("今日の場合は「(今日)」が表示される", () => {
      // Given: 今日の日付
      // When: コンポーネントをレンダリング
      render(<DateSelector date={mockToday} />);

      // Then: 「(今日)」が表示される
      expect(screen.getByText("(今日)")).toBeInTheDocument();
    });

    it("過去の日付の場合は「(今日)」が表示されない", () => {
      // Given: 昨日の日付
      const yesterday = subDays(mockToday, 1);

      // When: コンポーネントをレンダリング
      render(<DateSelector date={yesterday} />);

      // Then: 「(今日)」が表示されない
      expect(screen.queryByText("(今日)")).not.toBeInTheDocument();
    });
  });

  describe("ボタン操作", () => {
    it("前日ボタンをクリックすると前日に移動する", async () => {
      // Given: 今日の日付
      const user = userEvent.setup();
      const onDateChange = vi.fn();

      // When: 前日ボタンをクリック
      render(<DateSelector date={mockToday} onDateChange={onDateChange} />);
      const buttons = screen.getAllByRole("button");
      const prevButton = buttons[0]; // 最初のボタンが前日
      await user.click(prevButton);

      // Then: onDateChangeが前日で呼ばれる
      expect(onDateChange).toHaveBeenCalled();
      const calledDate = onDateChange.mock.calls[0][0];
      expect(format(calledDate, "yyyy-MM-dd")).toBe("2024-01-14");
    });

    it("翌日ボタンをクリックすると翌日に移動する", async () => {
      // Given: 昨日の日付
      const user = userEvent.setup();
      const yesterday = subDays(mockToday, 1);
      const onDateChange = vi.fn();

      // When: 翌日ボタンをクリック
      render(<DateSelector date={yesterday} onDateChange={onDateChange} />);
      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 1]; // 最後のボタンが翌日
      await user.click(nextButton);

      // Then: onDateChangeが翌日で呼ばれる
      expect(onDateChange).toHaveBeenCalled();
      const calledDate = onDateChange.mock.calls[0][0];
      expect(format(calledDate, "yyyy-MM-dd")).toBe("2024-01-15");
    });

    it("今日の場合、翌日ボタンが無効になる", () => {
      // Given: 今日の日付
      // When: コンポーネントをレンダリング
      render(<DateSelector date={mockToday} />);

      // Then: 翌日ボタンが無効
      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 1];
      expect(nextButton).toBeDisabled();
    });
  });

  describe("Props", () => {
    it("dateプロップで初期日付を設定できる", () => {
      // Given: 2024年1月10日
      const customDate = new Date(2024, 0, 10);

      // When: コンポーネントをレンダリング
      render(<DateSelector date={customDate} />);

      // Then: 指定した日付が表示される
      expect(screen.getByText(/2024\/1\/10/)).toBeInTheDocument();
    });

    it("onDateChangeコールバックが呼ばれる", async () => {
      // Given: onDateChangeコールバック
      const user = userEvent.setup();
      const onDateChange = vi.fn();

      // When: 前日ボタンをクリック
      render(<DateSelector date={mockToday} onDateChange={onDateChange} />);
      const buttons = screen.getAllByRole("button");
      const prevButton = buttons[0];
      await user.click(prevButton);

      // Then: onDateChangeが呼ばれる
      expect(onDateChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("エッジケース", () => {
    it("未来の日付は選択できない（翌日ボタン無効）", () => {
      // Given: 今日の日付
      // When: コンポーネントをレンダリング
      render(<DateSelector date={mockToday} />);

      // Then: 翌日ボタンが無効（今日が最新なので未来には進めない）
      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 1];
      expect(nextButton).toBeDisabled();
    });
  });
});
