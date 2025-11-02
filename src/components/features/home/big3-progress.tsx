import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

type Big3Exercise = {
  name: string;
  current: number; // 現在の最大重量（kg）
  target: number; // 目標重量（kg）
  color: string; // 進捗バーの色
};

interface Big3ProgressProps {
  benchPress: Big3Exercise;
  squat: Big3Exercise;
  deadlift: Big3Exercise;
}

export function Big3Progress({
  benchPress,
  squat,
  deadlift,
}: Big3ProgressProps) {
  const exercises = [benchPress, squat, deadlift];

  const calculateProgress = (current: number, target: number): number => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Big3 進捗</h3>
        </div>
        <div className="space-y-3">
          {exercises.map((exercise, index) => {
            const progress = calculateProgress(
              exercise.current,
              exercise.target
            );

            return (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{exercise.name}</span>
                  <span className="text-muted-foreground">
                    {exercise.current}kg / {exercise.target}kg
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
