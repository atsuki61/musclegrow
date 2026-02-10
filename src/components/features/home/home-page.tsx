"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { calculateMaxWeightsFromStorage } from "@/lib/max-weight";
import { TotalDaysBadge } from "./total-days-badge";

const Big3Progress = dynamic(() =>
  import("./big3-progress").then((mod) => mod.Big3Progress)
);
const RecordButton = dynamic(() =>
  import("./record-button").then((mod) => mod.RecordButton)
);

import {
  createBig3Data,
  type Big3ProgressData,
  type Big3Targets,
  type Big3Weights,
} from "@/lib/big3";

function getLocalMaxWeight(
  exerciseId: string | undefined,
  localMaxWeights: Record<string, number>
): number {
  if (!exerciseId) return 0;
  return localMaxWeights[exerciseId] || 0;
}

interface HomePageProps {
  dbWeights: Big3Weights;
  targets: Big3Targets;
  exerciseIds: {
    benchPress?: string;
    squat?: string;
    deadlift?: string;
  };
  totalDays: number;
}

export function HomePage({
  dbWeights,
  targets,
  exerciseIds,
  totalDays,
}: HomePageProps) {
  const [big3Data, setBig3Data] = useState<Big3ProgressData>(() =>
    createBig3Data(dbWeights, targets)
  );

  const mergeWithLocalData = useCallback(() => {
    const task = () => {
      const localMaxWeights = calculateMaxWeightsFromStorage();

      const finalWeights: Big3Weights = {
        benchPress: Math.max(
          dbWeights.benchPress,
          getLocalMaxWeight(exerciseIds.benchPress, localMaxWeights)
        ),
        squat: Math.max(
          dbWeights.squat,
          getLocalMaxWeight(exerciseIds.squat, localMaxWeights)
        ),
        deadlift: Math.max(
          dbWeights.deadlift,
          getLocalMaxWeight(exerciseIds.deadlift, localMaxWeights)
        ),
      };

      setBig3Data(createBig3Data(finalWeights, targets));
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(task);
    } else {
      setTimeout(task, 1);
    }
  }, [dbWeights, targets, exerciseIds]);

  useEffect(() => {
    mergeWithLocalData();
  }, [mergeWithLocalData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        mergeWithLocalData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [mergeWithLocalData]);

  return (
    <div className="container mx-auto px-4 pt-4 pb-4 space-y-6">
      {/* ヘッダーエリア */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-black italic tracking-tighter text-foreground">
          MuscleGrow
        </h1>
        <TotalDaysBadge days={totalDays} />
      </div>

      <Big3Progress
        benchPress={big3Data.benchPress}
        squat={big3Data.squat}
        deadlift={big3Data.deadlift}
      />
      <RecordButton />
    </div>
  );
}
