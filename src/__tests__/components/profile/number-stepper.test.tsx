import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberStepper } from "@/components/features/profile/number-stepper";

describe("NumberStepper", () => {
  const defaultProps = {
    label: "体重",
    value: 70,
    unit: "kg",
    onChange: vi.fn(),
  };

  describe("基本表示", () => {
    it("ラベルが表示される", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      render(<NumberStepper {...defaultProps} />);

      // Then: ラベルが表示される
      expect(screen.getByText("体重")).toBeInTheDocument();
    });

    it("値が表示される", () => {
      // Given: value = 70
      // When: コンポーネントをレンダリング
      render(<NumberStepper {...defaultProps} />);

      // Then: 値が表示される
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue(70);
    });

    it("単位が表示される", () => {
      // Given: unit = "kg"
      // When: コンポーネントをレンダリング
      render(<NumberStepper {...defaultProps} />);

      // Then: 単位が表示される
      expect(screen.getByText("kg")).toBeInTheDocument();
    });
  });

  describe("ボタン操作", () => {
    it("+ボタンクリックで値が増加する", async () => {
      // Given: value = 70
      const user = userEvent.setup();
      const onChange = vi.fn();

      // When: +ボタンをクリック
      render(<NumberStepper {...defaultProps} onChange={onChange} />);
      const plusButton = screen.getAllByRole("button")[1]; // 2つ目のボタンが+
      await user.click(plusButton);

      // Then: onChangeが70.1で呼ばれる（デフォルトstep=0.1）
      expect(onChange).toHaveBeenCalledWith(70.1);
    });

    it("-ボタンクリックで値が減少する", async () => {
      // Given: value = 70
      const user = userEvent.setup();
      const onChange = vi.fn();

      // When: -ボタンをクリック
      render(<NumberStepper {...defaultProps} onChange={onChange} />);
      const minusButton = screen.getAllByRole("button")[0]; // 1つ目のボタンが-
      await user.click(minusButton);

      // Then: onChangeが69.9で呼ばれる
      expect(onChange).toHaveBeenCalledWith(69.9);
    });

    it("最小値で-ボタンが無効になる", () => {
      // Given: value = 0（min = 0）
      // When: コンポーネントをレンダリング
      render(<NumberStepper {...defaultProps} value={0} min={0} />);

      // Then: -ボタンが無効
      const minusButton = screen.getAllByRole("button")[0];
      expect(minusButton).toBeDisabled();
    });

    it("最大値で+ボタンが無効になる", () => {
      // Given: value = 100（max = 100）
      // When: コンポーネントをレンダリング
      render(<NumberStepper {...defaultProps} value={100} max={100} />);

      // Then: +ボタンが無効
      const plusButton = screen.getAllByRole("button")[1];
      expect(plusButton).toBeDisabled();
    });

    it("stepに従って増減する", async () => {
      // Given: step = 1
      const user = userEvent.setup();
      const onChange = vi.fn();

      // When: +ボタンをクリック
      render(<NumberStepper {...defaultProps} step={1} onChange={onChange} />);
      const plusButton = screen.getAllByRole("button")[1];
      await user.click(plusButton);

      // Then: onChangeが71で呼ばれる
      expect(onChange).toHaveBeenCalledWith(71);
    });

    it("範囲外の値は設定されない", async () => {
      // Given: value = 100（既に最大値）, max = 100, step = 0.1
      const user = userEvent.setup();
      const onChange = vi.fn();

      // When: +ボタンをクリック（100を超えようとする）
      render(
        <NumberStepper
          {...defaultProps}
          value={100}
          max={100}
          step={0.1}
          onChange={onChange}
        />
      );
      const plusButton = screen.getAllByRole("button")[1];
      await user.click(plusButton); // 100.1にはならない（範囲外）

      // Then: onChangeは呼ばれない
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("直接入力", () => {
    it("数値を直接入力できる", async () => {
      // Given: デフォルトprops
      const user = userEvent.setup();

      // When: 入力フィールドに75を入力
      render(<NumberStepper {...defaultProps} />);
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "75");

      // Then: 値が75になる
      expect(input).toHaveValue(75);
    });

    it("入力時にonChangeが呼ばれる", async () => {
      // Given: デフォルトprops
      const user = userEvent.setup();
      const onChange = vi.fn();

      // When: 入力フィールドに75を入力
      render(<NumberStepper {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "75");

      // Then: onChangeが呼ばれる
      expect(onChange).toHaveBeenCalled();
    });

    it("onBlur時に範囲内に収まる（min未満）", async () => {
      // Given: min = 50
      const user = userEvent.setup();
      const onChange = vi.fn();

      // When: 入力フィールドに30を入力してフォーカスを外す
      render(<NumberStepper {...defaultProps} min={50} onChange={onChange} />);
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "30");
      await user.tab(); // フォーカスを外す（onBlur）

      // Then: onChangeが50で呼ばれる（minに調整）
      expect(onChange).toHaveBeenCalledWith(50);
    });

    it("onBlur時に範囲内に収まる（max超過）", async () => {
      // Given: max = 100
      const user = userEvent.setup();
      const onChange = vi.fn();

      // When: 入力フィールドに150を入力してフォーカスを外す
      render(<NumberStepper {...defaultProps} max={100} onChange={onChange} />);
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "150");
      await user.tab(); // フォーカスを外す（onBlur）

      // Then: onChangeが100で呼ばれる（maxに調整）
      expect(onChange).toHaveBeenCalledWith(100);
    });

    it("無効な値（NaN）の場合、元の値に戻る", async () => {
      // Given: value = 70
      const user = userEvent.setup();
      const onChange = vi.fn();

      // When: 入力フィールドに無効な値を入力してフォーカスを外す
      render(<NumberStepper {...defaultProps} onChange={onChange} />);
      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "abc");
      await user.tab(); // フォーカスを外す（onBlur）

      // Then: 元の値（70）に戻る
      expect(onChange).toHaveBeenCalledWith(70);
    });
  });

  describe("Props", () => {
    it("デフォルト値（step=0.1, min=0, max=300）が適用される", () => {
      // Given: デフォルトprops（step, min, maxを指定しない）
      // When: コンポーネントをレンダリング
      render(<NumberStepper {...defaultProps} />);

      // Then: input要素にデフォルト値が設定されている
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("step", "0.1");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "300");
    });

    it("カスタムのmin/max/stepが適用される", () => {
      // Given: カスタム値（step=5, min=10, max=200）
      // When: コンポーネントをレンダリング
      render(
        <NumberStepper {...defaultProps} step={5} min={10} max={200} />
      );

      // Then: input要素にカスタム値が設定されている
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("step", "5");
      expect(input).toHaveAttribute("min", "10");
      expect(input).toHaveAttribute("max", "200");
    });
  });

  describe("UI", () => {
    it("+/-アイコンが表示される", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      const { container } = render(<NumberStepper {...defaultProps} />);

      // Then: 2つのSVGアイコンが表示される（+ と -）
      const icons = container.querySelectorAll("svg");
      expect(icons).toHaveLength(2);
    });

    it("カスタムclassNameが適用される", () => {
      // Given: カスタムclassName
      // When: コンポーネントをレンダリング
      const { container } = render(
        <NumberStepper {...defaultProps} className="custom-class" />
      );

      // Then: カスタムクラスが適用されている
      const wrapper = container.querySelector(".custom-class");
      expect(wrapper).toBeInTheDocument();
    });
  });
});
