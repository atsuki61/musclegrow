"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
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
import { BodyPartNavigation } from "./body-part-navigation";
import {
  ExerciseIllustrationVisual,
  ExerciseName,
} from "./exercise-card-primitives";
import type { Exercise, BodyPart } from "@/types/workout";
import { cn } from "@/lib/utils";
import { getExerciseTargetMuscleLabels } from "@/lib/exercise-mappings";

// 種目追加モーダルのプロパティ
interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: Exercise) => void;
  onDeleteCustomExercise?: (exercise: Exercise) => void | Promise<void>;
  onRenameCustomExercise?: (exercise: Exercise) => void;
  isCustomExercise?: (exercise: Exercise) => boolean;
  allExercises: Exercise[];
  initialBodyPart?: Exclude<BodyPart, "all">;
}

// 種目追加モーダルのコンポーネント
export function AddExerciseModal({
  isOpen,
  onClose,
  onAddExercise,
  onDeleteCustomExercise,
  onRenameCustomExercise,
  isCustomExercise,
  allExercises,
  initialBodyPart,
}: AddExerciseModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<
    Exclude<BodyPart, "all">
  >(initialBodyPart || "chest");
  const [appliedOpenKey, setAppliedOpenKey] = useState<string | null>(null);

  const openKey = isOpen ? `open-${initialBodyPart ?? ""}` : null;

  // モーダルを開くたびに部位と検索を初期化
  if (openKey !== null && openKey !== appliedOpenKey) {
    setAppliedOpenKey(openKey);
    if (initialBodyPart) {
      setSelectedBodyPart(initialBodyPart);
    }
    setSearchQuery("");
  }

  if (!isOpen && appliedOpenKey !== null) {
    setAppliedOpenKey(null);
  }

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
      <DialogContent className="flex h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden border-0 bg-[var(--mg-bg)] p-0 text-foreground shadow-2xl sm:h-[82vh] sm:rounded-2xl sm:border sm:border-[var(--mg-border)]">
        {/* ヘッダー */}
        <DialogHeader className="shrink-0 border-b border-[var(--mg-border)] bg-[var(--mg-surface)] px-4 py-3">
          <DialogTitle className="text-center text-lg font-black">
            種目を追加
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="existing" className="flex-1 flex flex-col min-h-0">
          <div className="shrink-0 bg-[var(--mg-bg)] px-4 pt-3 pb-0">
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-2xl border border-[var(--mg-border)] bg-[var(--mg-surface)] p-1">
              <TabsTrigger
                value="existing"
                className="rounded-xl text-sm font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                リストから選択
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="rounded-xl text-sm font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                カスタム作成
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 既存種目タブ */}
          <TabsContent
            value="existing"
            className="flex-1 flex flex-col min-h-0 mt-0"
          >
            <div className="shrink-0 space-y-3 border-b border-[var(--mg-border)] bg-[var(--mg-bg)] px-3 py-3">
              {/* 部位フィルター */}
              <BodyPartNavigation
                selectedPart={selectedBodyPart}
                onPartChange={(part) => {
                  if (part === "all") return;
                  setSelectedBodyPart(part);
                  setSearchQuery("");
                }}
              />

              {/* 検索バー */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="追加したい種目を検索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 rounded-2xl border-[var(--mg-border)] bg-[var(--mg-surface)] pl-9 text-sm font-bold placeholder:text-muted-foreground/70 focus:border-primary focus:bg-[var(--mg-surface-strong)]"
                />
              </div>
            </div>

            {/* 種目リスト */}
            <ScrollArea className="min-h-0 flex-1 bg-[var(--mg-bg)]">
              <div className="p-3 pb-20">
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">
                      {searchQuery
                        ? "検索結果が見つかりませんでした"
                        : "この部位には追加可能な種目がありません"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {filteredExercises.map((exercise) => {
                      const targetMuscleLabels =
                        getExerciseTargetMuscleLabels(exercise);
                      const fallbackLabel = targetMuscleLabels[0] ?? "全体";
                      const canDeleteCustomExercise =
                        isCustomExercise?.(exercise) ?? false;
                      return (
                        <div
                          key={exercise.id}
                          className={cn(
                            "group relative aspect-[1/1.08] min-h-[128px] min-w-0 overflow-hidden rounded-[1.15rem] border text-left",
                            "border-[var(--mg-border)] bg-[var(--mg-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                            "transition-[transform,border-color,background-color,box-shadow] duration-200",
                            "hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/[0.035] active:scale-[0.985]"
                          )}
                        >
                          <div className="absolute inset-0 bg-linear-to-br from-white/[0.045] via-transparent to-primary/[0.035] opacity-80" />
                          {canDeleteCustomExercise ? (
                            <>
                              <button
                                type="button"
                                aria-label={`${exercise.name}の名前を変更`}
                                onClick={() => onRenameCustomExercise?.(exercise)}
                                className="absolute right-8 top-1.5 z-20 flex size-6 items-center justify-center rounded-md border border-primary/35 bg-[var(--mg-surface)]/90 text-primary shadow-sm backdrop-blur-md transition-colors hover:border-primary/60 hover:bg-primary/10"
                              >
                                <Pencil className="size-3.5 stroke-[3]" />
                              </button>
                              <button
                                type="button"
                                aria-label={`${exercise.name}を完全に削除`}
                                onClick={() => {
                                  void onDeleteCustomExercise?.(exercise);
                                }}
                                className="absolute right-1.5 top-1.5 z-20 flex size-6 items-center justify-center rounded-md border border-red-500/40 bg-[var(--mg-surface)]/90 text-red-400 shadow-sm backdrop-blur-md transition-colors hover:border-red-400 hover:bg-red-500/15"
                              >
                                <Trash2 className="size-3.5 stroke-[3]" />
                              </button>
                            </>
                          ) : (
                            <span className="absolute right-1.5 top-1.5 z-20 flex size-6 items-center justify-center rounded-md border border-primary/35 bg-[var(--mg-surface)]/90 text-primary shadow-sm backdrop-blur-md">
                              <Plus className="size-4 stroke-[3]" />
                            </span>
                          )}
                          <span className="absolute left-1.5 top-1.5 z-20 max-w-[64%] rounded-md border border-border/50 bg-[var(--mg-surface)]/90 px-1.5 py-0.5 text-[8px] font-black leading-none text-muted-foreground backdrop-blur-md">
                            {fallbackLabel}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleSelectExercise(exercise)}
                            className="relative z-10 flex h-full w-full flex-col px-2 pb-2.5 pt-2.5 text-left"
                          >
                            <div className="relative min-h-0 flex-1 overflow-visible pt-5">
                              <div className="absolute inset-x-0 bottom-0 top-6">
                                <ExerciseIllustrationVisual
                                  exercise={exercise}
                                  fallbackLabel={fallbackLabel}
                                  imageClassName="max-h-[96px]"
                                />
                              </div>
                            </div>
                            <ExerciseName name={exercise.name} />
                          </button>
                        </div>
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
            className="mt-0 min-h-0 flex-1 overflow-hidden"
          >
            <div className="h-full overflow-y-auto bg-[var(--mg-bg)] [-webkit-overflow-scrolling:touch]">
              <div className="p-4 pb-20">
                <CustomExerciseForm
                  initialBodyPart={initialBodyPart}
                  onAdd={handleAddCustomExercise}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
