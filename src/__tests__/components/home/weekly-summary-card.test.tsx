import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklySummaryCard } from "@/components/features/home/weekly-summary-card";
import { getWeekRange } from "@/lib/utils/weekly-summary";
import type { WeeklySummary } from "@/lib/utils/weekly-summary";

vi.mock("@/lib/auth-session-context", () => ({
  useAuthSession: () => ({ userId: "user1" }),
}));

// ログイン+移行完了=DBのみ（localStorageマージしない）。vi.fn で per-test 上書き可能にする。
vi.mock("@/lib/data-source", () => ({
  shouldUseDbOnly: vi.fn(() => true),
}));

vi.mock("@/lib/local-storage-weekly-summary", () => ({
  getWeeklySummaryFromStorage: vi.fn(),
}));

// モック済み関数を import して per-test で返り値を制御する
import { shouldUseDbOnly } from "@/lib/data-source";
import { getWeeklySummaryFromStorage } from "@/lib/local-storage-weekly-summary";

function makeSummary(over: Partial<WeeklySummary> = {}): WeeklySummary {
  return {
    weekStart: "2024-01-15",
    weekEnd: "2024-01-21",
    trainedDays: [true, false, true, false, false, false, false],
    gymCount: 2,
    totalVolume: 12500,
    totalSets: 48,
    prevWeekVolume: 11000,
    ...over,
  };
}

describe("WeeklySummaryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks は実装をリセットするためデフォルト値を再設定する
    vi.mocked(shouldUseDbOnly).mockReturnValue(true);
  });

  it("総ボリューム・総セットを桁区切りで表示する", () => {
    // When
    render(<WeeklySummaryCard initial={makeSummary()} />);
    // Then
    expect(screen.getByText("12,500")).toBeInTheDocument();
    expect(screen.getByText("48")).toBeInTheDocument();
  });

  it("先週比%を表示する（増加）", () => {
    render(<WeeklySummaryCard initial={makeSummary()} />);
    // (12500-11000)/11000 ≈ +14%
    expect(screen.getByText("+14%")).toBeInTheDocument();
  });

  it("先週が0ならNEWを表示する", () => {
    render(
      <WeeklySummaryCard initial={makeSummary({ prevWeekVolume: 0 })} />
    );
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("記録ゼロのとき空メッセージを表示する", () => {
    render(
      <WeeklySummaryCard
        initial={makeSummary({
          trainedDays: [false, false, false, false, false, false, false],
          gymCount: 0,
          totalVolume: 0,
          totalSets: 0,
          prevWeekVolume: 0,
        })}
      />
    );
    expect(screen.getByText("今週はまだ記録がありません")).toBeInTheDocument();
  });

  it("曜日ラベルを月〜日で表示する", () => {
    render(<WeeklySummaryCard initial={makeSummary()} />);
    ["月", "火", "水", "木", "金", "土", "日"].forEach((d) =>
      expect(screen.getByText(d)).toBeInTheDocument()
    );
  });

  it("ゲスト経路: localStorageサマリーをDBサマリーとマージして表示する", async () => {
    // shouldUseDbOnly を false に設定してゲスト(マージ)経路を有効化
    vi.mocked(shouldUseDbOnly).mockReturnValue(false);

    // 現在週の weekStart/weekEnd を実際の getWeekRange() から取得してズレを防ぐ
    const range = getWeekRange();

    // DB側の初期サマリー: 月曜のみ学習済み、ボリューム5000、セット20
    const dbSummary: WeeklySummary = {
      weekStart: range.weekStart,
      weekEnd: range.weekEnd,
      trainedDays: [true, false, false, false, false, false, false],
      gymCount: 1,
      totalVolume: 5000,
      totalSets: 20,
      prevWeekVolume: 0,
    };

    // localStorage側のサマリー: 水曜のみ学習済み、ボリューム7500、セット28
    const localSummary: WeeklySummary = {
      weekStart: range.weekStart,
      weekEnd: range.weekEnd,
      trainedDays: [false, false, true, false, false, false, false],
      gymCount: 1,
      totalVolume: 7500,
      totalSets: 28,
      prevWeekVolume: 0,
    };

    vi.mocked(getWeeklySummaryFromStorage).mockReturnValue(localSummary);

    // When: ゲストとして render（初期値は DB サマリー）
    render(<WeeklySummaryCard initial={dbSummary} />);

    // Then: マージ後の合計ボリューム 12,500 とセット数 48 が非同期で表示される
    // (requestIdleCallback 未対応環境では setTimeout(task, 1) にフォールバックされる)
    expect(await screen.findByText("12,500")).toBeInTheDocument();
    expect(await screen.findByText("48")).toBeInTheDocument();
  });
});
