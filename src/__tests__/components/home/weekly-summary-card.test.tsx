import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WeeklySummaryCard } from "@/components/features/home/weekly-summary-card";
import type { WeeklySummary } from "@/lib/utils/weekly-summary";

vi.mock("@/lib/auth-session-context", () => ({
  useAuthSession: () => ({ userId: "user1" }),
}));

// ログイン+移行完了=DBのみ（localStorageマージしない）
vi.mock("@/lib/data-source", () => ({
  shouldUseDbOnly: () => true,
}));

vi.mock("@/lib/local-storage-weekly-summary", () => ({
  getWeeklySummaryFromStorage: vi.fn(),
}));

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
  beforeEach(() => vi.clearAllMocks());

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
});
