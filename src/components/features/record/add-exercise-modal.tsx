"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomExerciseForm } from "./custom-exercise-form";
import type { Exercise, BodyPart, MuscleSubGroup } from "@/types/workout";
import { BODY_PART_LABELS } from "@/lib/utils";

/**
 * サブ分類のラベル定義
 */
const MUSCLE_SUB_GROUP_LABELS: Record<MuscleSubGroup, string> = {
  // 胸
  chest_overall: "全体",
  chest_upper: "上部",
  chest_lower: "下部",
  chest_outer: "外側",
  // 背中
  back_overall: "全体",
  back_width: "幅",
  back_thickness: "厚み",
  back_traps: "僧帽筋・下部",
  // 脚
  legs_quads: "大腿四頭筋",
  legs_hamstrings: "ハムストリングス",
  legs_glutes: "臀筋",
  legs_calves: "下腿",
  // 肩
  shoulders_overall: "全体",
  shoulders_front: "前部",
  shoulders_middle: "中部",
  shoulders_rear: "後部",
  // 腕
  arms_biceps: "上腕二頭筋",
  arms_triceps: "上腕三頭筋",
  // 腹筋
  core_rectus: "腹直筋",
  core_transverse: "腹横筋",
  core_obliques: "腹斜筋",
};

interface AddExerciseModalProps {
  /** モーダルの開閉状態 */
  isOpen: boolean;
  /** モーダルを閉じる時のコールバック */
  onClose: () => void;
  /** 種目を追加するコールバック */
  onAddExercise: (exercise: Exercise) => void;
  /** 既存の種目リスト（selectable種目をフィルタリングするため） */
  allExercises: Exercise[];
  /** 初期の部位（親コンポーネントから渡される） */
  initialBodyPart?: Exclude<BodyPart, "all">;
}

/**
 * 種目追加モーダルコンポーネント
 * 既存種目から選択するか、カスタム種目を追加できる
 */
export function AddExerciseModal({
  isOpen,
  onClose,
  onAddExercise,
  allExercises,
  initialBodyPart,
}: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<
    Exclude<BodyPart, "all">
  >(initialBodyPart || "chest");

  // initialBodyPartが変更されたとき、またはモーダルが開かれたときにselectedBodyPartを更新
  useEffect(() => {
    if (isOpen && initialBodyPart) {
      setSelectedBodyPart(initialBodyPart);
      // 検索クエリもリセット
      setSearchQuery("");
    }
  }, [initialBodyPart, isOpen]);

  // 選択可能な種目（tier === "selectable"）をフィルタリング
  const selectableExercises = useMemo(() => {
    return allExercises.filter(
      (exercise) =>
        exercise.tier === "selectable" && exercise.bodyPart === selectedBodyPart
    );
  }, [allExercises, selectedBodyPart]);

  // 検索クエリでフィルタリング
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return selectableExercises;
    const query = searchQuery.toLowerCase();
    return selectableExercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(query)
    );
  }, [selectableExercises, searchQuery]);

  /**
   * 既存種目を選択して追加
   */
  const handleSelectExercise = (exercise: Exercise) => {
    // tierを"initial"に変更して追加（表示されるようにする）
    const updatedExercise: Exercise = {
      ...exercise,
      tier: "initial",
    };
    onAddExercise(updatedExercise);
    onClose();
    // フォームをリセット
    setSearchQuery("");
  };

  /**
   * カスタム種目を追加
   */
  const handleAddCustomExercise = (exercise: Exercise) => {
    onAddExercise(exercise);
    // モーダルは閉じない（複数追加可能）
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl font-bold">種目を追加</DialogTitle>
          <DialogDescription className="sr-only">
            既存の種目から選択するか、カスタム種目を追加できます
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="existing"
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">種目を選択</TabsTrigger>
              <TabsTrigger value="custom">種目を追加</TabsTrigger>
            </TabsList>
          </div>

          {/* 既存種目タブ */}
          <TabsContent
            value="existing"
            className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden"
          >
            <div className="px-6 space-y-4 shrink-0">
              {/* 部位選択 */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Object.entries(BODY_PART_LABELS)
                  .filter(([key]) => key !== "all")
                  .map(([key, label]) => (
                    <Button
                      key={key}
                      variant={selectedBodyPart === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedBodyPart(key as Exclude<BodyPart, "all">);
                        setSearchQuery("");
                      }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </Button>
                  ))}
              </div>

              {/* 検索バー */}
              <Input
                placeholder="種目名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 種目一覧 */}
            <ScrollArea className="flex-1 px-6 pb-6 min-h-0">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">
                    {searchQuery
                      ? "検索結果が見つかりませんでした"
                      : "この部位には追加可能な種目がありません"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-4">
                  {filteredExercises.map((exercise) => {
                    const subGroupLabel = exercise.muscleSubGroup
                      ? MUSCLE_SUB_GROUP_LABELS[exercise.muscleSubGroup]
                      : undefined;
                    return (
                      <Button
                        key={exercise.id}
                        variant="outline"
                        onClick={() => handleSelectExercise(exercise)}
                        className="h-auto flex flex-col items-center justify-center p-4 py-6 hover:bg-muted"
                      >
                        <span className="text-sm font-medium text-center">
                          {exercise.name}
                        </span>
                        {subGroupLabel && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {subGroupLabel}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* カスタム種目追加タブ */}
          <TabsContent
            value="custom"
            className="flex-1 flex flex-col min-h-0 mt-4 overflow-hidden"
          >
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 pb-6">
                <CustomExerciseForm
                  initialBodyPart={initialBodyPart}
                  onAdd={handleAddCustomExercise}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
