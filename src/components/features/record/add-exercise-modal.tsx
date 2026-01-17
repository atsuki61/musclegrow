"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomExerciseForm } from "./custom-exercise-form";
import type { Exercise, BodyPart } from "@/types/workout";
import { BODY_PART_LABELS } from "@/lib/utils";
import { MUSCLE_SUB_GROUP_LABELS } from "@/lib/exercise-mappings";

// 種目追加モーダルのプロパティ
interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: Exercise) => void;
  allExercises: Exercise[];
  initialBodyPart?: Exclude<BodyPart, "all">;
}

// 種目追加モーダルのコンポーネント
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

  // 初期ボディーパートが変更された場合、選択されたボディーパートを更新
  useEffect(() => {
    if (isOpen && initialBodyPart) {
      setSelectedBodyPart(initialBodyPart);
      setSearchQuery("");
    }
  }, [initialBodyPart, isOpen]);

  // 選択可能な種目を取得
  const selectableExercises = useMemo(() => {
    return allExercises.filter(
      (exercise) =>
        exercise.tier === "selectable" && exercise.bodyPart === selectedBodyPart
    );
  }, [allExercises, selectedBodyPart]);

  // 検索クエリに基づいて種目をフィルタリング
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return selectableExercises;
    const query = searchQuery.toLowerCase();
    return selectableExercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(query)
    );
  }, [selectableExercises, searchQuery]);

  // 種目を選択
  const handleSelectExercise = (exercise: Exercise) => {
    // 種目を更新
    const updatedExercise: Exercise = {
      ...exercise,
      tier: "initial",
    };
    onAddExercise(updatedExercise);
    onClose();
    setSearchQuery("");
  };

  // カスタム種目を追加
  const handleAddCustomExercise = (exercise: Exercise) => {
    onAddExercise(exercise);
    setSearchQuery("");
  };

  // 種目追加モーダルのコンポーネントを返す
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-0 sm:border">
        {/* ヘッダー */}
        <DialogHeader className="px-4 py-3 border-b bg-background shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold">種目を追加</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full"
          >
            <span className="sr-only">閉じる</span>✕
          </Button>
        </DialogHeader>

        <Tabs defaultValue="existing" className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-3 pb-0 shrink-0 bg-muted/20">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="existing">リストから選択</TabsTrigger>
              <TabsTrigger value="custom">カスタム作成</TabsTrigger>
            </TabsList>
          </div>

          {/* 既存種目タブ */}
          <TabsContent
            value="existing"
            className="flex-1 flex flex-col min-h-0 mt-0"
          >
            <div className="px-4 py-3 space-y-3 border-b bg-background shrink-0">
              {/* 部位フィルター */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
                {Object.entries(BODY_PART_LABELS)
                  .filter(([key]) => key !== "all")
                  .map(([key, label]) => {
                    const isSelected = selectedBodyPart === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedBodyPart(key as Exclude<BodyPart, "all">);
                          setSearchQuery("");
                        }}
                        className={`
                          whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all
                          ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }
                        `}
                      >
                        {label}
                      </button>
                    );
                  })}
              </div>

              {/* 検索バー */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="種目名を検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/30 border-transparent focus:bg-background focus:border-primary rounded-xl h-10"
                />
              </div>
            </div>

            {/* 種目リスト */}
            <ScrollArea className="flex-1 bg-muted/10">
              <div className="p-4 pb-20">
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">
                      {searchQuery
                        ? "検索結果が見つかりませんでした"
                        : "この部位には追加可能な種目がありません"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredExercises.map((exercise) => {
                      const subGroupLabel = exercise.muscleSubGroup
                        ? MUSCLE_SUB_GROUP_LABELS[exercise.muscleSubGroup]
                        : undefined;
                      return (
                        <button
                          key={exercise.id}
                          onClick={() => handleSelectExercise(exercise)}
                          className="flex flex-col items-start p-3 bg-card border rounded-xl shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all text-left group"
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <span className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                              {exercise.name}
                            </span>
                            <Plus className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary" />
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-auto bg-muted px-1.5 py-0.5 rounded group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {subGroupLabel || "全体"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* カスタム作成タブ */}
          <TabsContent
            value="custom"
            className="flex-1 flex flex-col min-h-0 mt-0"
          >
            <ScrollArea className="flex-1 p-4">
              <CustomExerciseForm
                initialBodyPart={initialBodyPart}
                onAdd={handleAddCustomExercise}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
