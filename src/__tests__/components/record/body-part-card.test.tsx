import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BodyPartCard } from "@/components/features/record/body-part-card";
import type { Exercise } from "@/types/workout";

describe("BodyPartCard", () => {
  const mockExercises: Exercise[] = [
    {
      id: "ex-1",
      name: "ベンチプレス",
      bodyPart: "chest",
      tier: "initial",
      isBig3: false,
      muscleSubGroup: "upper",
    },
    {
      id: "ex-2",
      name: "スクワット",
      bodyPart: "legs",
      tier: "initial",
      isBig3: true,
      muscleSubGroup: "front",
    },
    {
      id: "ex-3",
      name: "デッドリフト",
      bodyPart: "back",
      tier: "advanced", // tier が initial ではない
      isBig3: true,
    },
  ];

  const mockMaxWeights = {
    "ex-1": 100,
    "ex-2": 150,
  };

  describe("基本表示", () => {
    it("種目カードが表示される", () => {
      // Given: 2つの initial tier 種目
      // When: コンポーネントをレンダリング
      const { container } = render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
        />
      );

      // Then: 種目ボタンが表示される（initial tier のみなので2つ）
      const buttons = container.querySelectorAll("button");
      // 種目2つ + 追加ボタン1つ = 3つ
      expect(buttons.length).toBe(3);
    });

    it("種目名が表示される", () => {
      // Given: mockExercises
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
        />
      );

      // Then: 種目名が表示される
      expect(screen.getByText("ベンチプレス")).toBeInTheDocument();
      expect(screen.getByText("スクワット")).toBeInTheDocument();
      // ex-3はtier="advanced"なので表示されない
      expect(screen.queryByText("デッドリフト")).not.toBeInTheDocument();
    });

    it("サブグループラベルが表示される", () => {
      // Given: muscleSubGroup付きの種目
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
        />
      );

      // Then: サブグループラベル（またはデフォルトの「全体」）が表示される
      // muscleSubGroupが定義されていない場合は「全体」が表示される
      const labels = screen.getAllByText("全体");
      expect(labels.length).toBeGreaterThan(0);
    });

    it("追加ボタンが表示される", () => {
      // Given: デフォルトprops
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
        />
      );

      // Then: 追加ボタンが表示される
      expect(screen.getByText("追加")).toBeInTheDocument();
    });
  });

  describe("MAX重量表示", () => {
    it("筋トレ種目の場合、MAX重量が表示される", () => {
      // Given: MAX重量がある種目
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
        />
      );

      // Then: MAX重量が表示される
      expect(screen.getByText("100kg")).toBeInTheDocument();
      expect(screen.getByText("150kg")).toBeInTheDocument();
    });

    it("MAX重量がない場合は\"-\"が表示される", () => {
      // Given: MAX重量がない種目
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard bodyPart="chest" exercises={mockExercises} maxWeights={{}} />
      );

      // Then: "-"が表示される
      const badges = screen.getAllByText("-");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("有酸素種目の場合、MAX重量は表示されない", () => {
      // Given: 有酸素種目
      const cardioExercise: Exercise = {
        id: "ex-cardio",
        name: "ランニング",
        bodyPart: "other",
        tier: "initial",
        isBig3: false,
        isCardio: true,
      };

      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="other"
          exercises={[cardioExercise]}
          maxWeights={{}}
        />
      );

      // Then: MAX重量バッジが表示されない（"-"も表示されない）
      expect(screen.queryByText("-")).not.toBeInTheDocument();
      expect(screen.queryByText(/kg/)).not.toBeInTheDocument();
    });
  });

  describe("編集モード", () => {
    it("編集モード時は削除バッジが表示される", () => {
      // Given: isEditMode = true
      // When: コンポーネントをレンダリング
      const { container } = render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
          isEditMode={true}
        />
      );

      // Then: 削除アイコン（MinusCircle）が表示される
      const minusIcons = container.querySelectorAll("svg");
      // 削除アイコンが存在する
      expect(minusIcons.length).toBeGreaterThan(0);
    });

    it("編集モード時は追加ボタンが非表示", () => {
      // Given: isEditMode = true
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
          isEditMode={true}
        />
      );

      // Then: 追加ボタンが表示されない
      expect(screen.queryByText("追加")).not.toBeInTheDocument();
    });

    it("編集モード時は特別なスタイルが適用される", () => {
      // Given: isEditMode = true
      // When: コンポーネントをレンダリング
      const { container } = render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
          isEditMode={true}
        />
      );

      // Then: 編集モード用のクラスが適用される
      const exerciseButtons = container.querySelectorAll("button");
      // 最初のボタン（種目カード）に編集モード用クラスがある
      expect(exerciseButtons[0]).toHaveClass("animate-pulse-slow");
    });
  });

  describe("イベントハンドラ", () => {
    it("種目カードをクリックするとonExerciseSelectが呼ばれる", async () => {
      // Given: onExerciseSelectコールバック
      const user = userEvent.setup();
      const onExerciseSelect = vi.fn();

      // When: 種目カードをクリック
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
          onExerciseSelect={onExerciseSelect}
        />
      );
      const benchPressCard = screen.getByText("ベンチプレス");
      await user.click(benchPressCard);

      // Then: onExerciseSelectが呼ばれる
      expect(onExerciseSelect).toHaveBeenCalledWith(mockExercises[0]);
    });

    it("追加ボタンをクリックするとonAddExerciseClickが呼ばれる", async () => {
      // Given: onAddExerciseClickコールバック
      const user = userEvent.setup();
      const onAddExerciseClick = vi.fn();

      // When: 追加ボタンをクリック
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
          onAddExerciseClick={onAddExerciseClick}
        />
      );
      const addButton = screen.getByText("追加");
      await user.click(addButton);

      // Then: onAddExerciseClickが呼ばれる
      expect(onAddExerciseClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("空状態", () => {
    it("種目が0件の場合、空状態メッセージが表示される", () => {
      // Given: 空の種目リスト
      // When: コンポーネントをレンダリング
      render(<BodyPartCard bodyPart="chest" exercises={[]} maxWeights={{}} />);

      // Then: 空状態メッセージが表示される
      expect(screen.getByText("種目が見つかりません")).toBeInTheDocument();
      expect(
        screen.getByText("新しい種目を追加してみましょう")
      ).toBeInTheDocument();
    });

    it("種目がある場合、空状態メッセージは表示されない", () => {
      // Given: 種目がある
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
        />
      );

      // Then: 空状態メッセージが表示されない
      expect(screen.queryByText("種目が見つかりません")).not.toBeInTheDocument();
    });
  });

  describe("フィルタリング", () => {
    it("tier=\"initial\"の種目のみ表示される", () => {
      // Given: tier="initial"とtier="advanced"が混在
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
        />
      );

      // Then: tier="initial"の種目のみ表示される
      expect(screen.getByText("ベンチプレス")).toBeInTheDocument(); // tier="initial"
      expect(screen.getByText("スクワット")).toBeInTheDocument(); // tier="initial"
      expect(screen.queryByText("デッドリフト")).not.toBeInTheDocument(); // tier="advanced"
    });
  });
});
