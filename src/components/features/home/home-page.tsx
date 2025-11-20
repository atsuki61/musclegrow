"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { calculateMaxWeightsFromStorage } from "@/lib/max-weight";

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

/**
 * ローカルストレージから最大重量を取得する
 * 種目IDが一致しない場合でも、ローカルストレージの全ての種目IDから最大重量を取得
 */
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
}

export function HomePage({ dbWeights, targets, exerciseIds }: HomePageProps) {
  const [big3Data, setBig3Data] = useState<Big3ProgressData>(() =>
    createBig3Data(dbWeights, targets)
  );
  const dbWeightsRef = useRef<Big3Weights>(dbWeights);
  const targetsRef = useRef<Big3Targets>(targets);
  const exerciseIdsRef = useRef(exerciseIds);

  useEffect(() => {
    dbWeightsRef.current = dbWeights;
    targetsRef.current = targets;
    exerciseIdsRef.current = exerciseIds;
    setBig3Data(createBig3Data(dbWeights, targets));
  }, [dbWeights, targets, exerciseIds]);

  const mergeWithLocalData = useCallback(() => {
    const task = () => {
      const localMaxWeights = calculateMaxWeightsFromStorage();
      const currentExerciseIds = exerciseIdsRef.current;

      const finalWeights: Big3Weights = {
        benchPress: Math.max(
          dbWeightsRef.current.benchPress,
          getLocalMaxWeight(currentExerciseIds.benchPress, localMaxWeights)
        ),
        squat: Math.max(
          dbWeightsRef.current.squat,
          getLocalMaxWeight(currentExerciseIds.squat, localMaxWeights)
        ),
        deadlift: Math.max(
          dbWeightsRef.current.deadlift,
          getLocalMaxWeight(currentExerciseIds.deadlift, localMaxWeights)
        ),
      };

      dbWeightsRef.current = finalWeights;
      setBig3Data(createBig3Data(finalWeights, targetsRef.current));
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(task);
    } else {
      setTimeout(task, 1);
    }
  }, []);

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
