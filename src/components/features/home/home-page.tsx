"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Big3Progress } from "./big3-progress";
import { RecordButton } from "./record-button";
import { calculateMaxWeights } from "@/lib/max-weight";
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
    const localMaxWeights = calculateMaxWeights();
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
