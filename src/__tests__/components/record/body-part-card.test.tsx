import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

    it("長い種目名は1行表示用のスタイルになる", () => {
      // Given: 2行になりやすい長い種目名
      const longNameExercise: Exercise = {
        id: "ex-long",
        name: "インクラインダンベルプレス",
        bodyPart: "chest",
        tier: "initial",
        isBig3: false,
      };

      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={[longNameExercise]}
          maxWeights={{}}
        />
      );

      // Then: 省略せずに1行固定と長い名前用の縮小テキストが適用される
      const name = screen.getByText("インクラインダンベルプレス");
      expect(name.className).toContain("whitespace-nowrap");
      expect(name.className).not.toContain("truncate");
      expect(name.className).not.toContain("line-clamp-2");
      expect(name).toHaveStyle({ fontSize: "8px", transform: "scaleX(1)" });
      expect(name.parentElement?.className).toContain("overflow-hidden");
    });

    it("一覧カードでは前回記録を表示しない", () => {
      // Given: muscleSubGroup付きの種目
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={mockExercises}
          maxWeights={mockMaxWeights}
        />
      );

      // Then: 前回記録はモーダル側に集約するため表示されない
      expect(screen.queryByText("前回の記録")).not.toBeInTheDocument();
      expect(screen.queryByText("記録なし")).not.toBeInTheDocument();
    });

    it("線画がない種目は人体フォールバック画像を表示する", () => {
      // Given: 線画マップにないカスタム種目
      const customExercise: Exercise = {
        id: "ex-custom",
        name: "カスタム胸種目",
        bodyPart: "chest",
        tier: "initial",
        isBig3: false,
        muscleSubGroup: "upper",
      };

      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard
          bodyPart="chest"
          exercises={[customExercise]}
          maxWeights={{}}
        />
      );

      // Then: 個別線画ではなく人体フォールバック画像が表示される
      expect(
        screen.getByAltText("カスタム胸種目の人体フォールバック線画")
      ).toBeInTheDocument();
      expect(
        screen.queryByAltText("カスタム胸種目の線画イラスト")
      ).not.toBeInTheDocument();
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
      expect(screen.getByText("種目を追加")).toBeInTheDocument();
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
      expect(screen.getByText("MAX 100kg")).toBeInTheDocument();
      expect(screen.getByText("MAX 150kg")).toBeInTheDocument();
    });

    it("MAX重量がない場合は\"-\"が表示される", () => {
      // Given: MAX重量がない種目
      // When: コンポーネントをレンダリング
      render(
        <BodyPartCard bodyPart="chest" exercises={mockExercises} maxWeights={{}} />
      );

      // Then: "MAX -"が表示される
      const badges = screen.getAllByText("MAX -");
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
      expect(screen.queryByText("MAX -")).not.toBeInTheDocument();
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

    it("編集モード時も追加カードは同じ位置に残り無効化される", () => {
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

      // Then: 追加カードは表示されるが無効状態になる
      const addButton = screen.getByText("種目を追加").closest("button");
      expect(addButton).toHaveAttribute("aria-disabled", "true");
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

      // Then: 編集モード用の赤い境界スタイルが適用される
      const exerciseButtons = container.querySelectorAll("button");
      expect(exerciseButtons[0].className).toContain("border-red-500/40");
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
      const addButton = screen.getByText("種目を追加");
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
