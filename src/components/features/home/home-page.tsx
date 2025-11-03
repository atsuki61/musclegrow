import { Big3Progress } from "./big3-progress";
import { RecordButton } from "./record-button";

export function HomePage() {
  // ダミーデータ（将来的にはAPIから取得）
  const big3Data = {
    benchPress: {
      name: "ベンチプレス",
      current: 90,
      target: 100,
      color: "bg-red-500",
    },
    squat: {
      name: "スクワット",
      current: 100,
      target: 120,
      color: "bg-green-500",
    },
    deadlift: {
      name: "デッドリフト",
      current: 120,
      target: 140,
      color: "bg-blue-500",
    },
  };
  return (
    <div className="container mx-auto px-4 pt-0 pb-4 space-y-6">
      <Big3Progress
        benchPress={big3Data.benchPress}
        squat={big3Data.squat}
        deadlift={big3Data.deadlift}
      />
      <RecordButton />
    </div>
  );
}
