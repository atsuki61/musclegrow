"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Loader2, Download, X } from "lucide-react";
import { ShareImage } from "./share-image";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { useColorTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  workoutExercises: Array<{ exerciseId: string; sets: SetRecord[] }>;
  cardioExercises: Array<{ exerciseId: string; records: CardioRecord[] }>;
  exercises: Exercise[];
  maxWeights?: Record<string, number>;
}

export function ShareModal({
  isOpen,
  onClose,
  date,
  workoutExercises,
  cardioExercises,
  exercises,
  maxWeights = {},
}: ShareModalProps) {
  const { color } = useColorTheme();
  const { theme } = useTheme();
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const imageRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Web Share API が使えるかチェック
  useEffect(() => {
    // 修正: 'share' in navigator でチェックすることでTSエラーを回避
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanShare(true);
    }
  }, []);

  const generateBlob = async () => {
    if (!imageRef.current) return null;
    const dataUrl = await toPng(imageRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleSaveImage = useCallback(async () => {
    if (!imageRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(imageRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const fileName = `musclegrow_${date.toISOString().split("T")[0]}.png`;
      download(dataUrl, fileName);
      toast.success("画像を保存しました");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("画像の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  }, [date, onClose]);

  const handleShare = useCallback(async () => {
    if (!imageRef.current) return;
    try {
      setIsGenerating(true);
      const blob = await generateBlob();
      if (!blob) throw new Error("Blob generation failed");

      const fileName = `musclegrow_${date.toISOString().split("T")[0]}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // 修正: 型安全なチェック
      if (
        "canShare" in navigator &&
        (navigator as any).canShare({ files: [file] }) // eslint-disable-line @typescript-eslint/no-explicit-any
      ) {
        await navigator.share({
          files: [file],
          title: "MuscleGrow Workout Log",
          text: `${date.toLocaleDateString()}のトレーニング記録 #MuscleGrow`,
        });
        toast.success("共有しました");
      } else {
        throw new Error("お使いのブラウザは画像共有に対応していません");
      }
    } catch (err) {
      console.error(err);
      if ((err as Error).name !== "AbortError") {
        toast.error("共有に失敗しました。画像を保存してください。");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [date]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md w-full h-[95dvh] max-h-[900px] p-0 overflow-hidden bg-slate-950 border-slate-800 flex flex-col"
      >
        {/* ヘッダー */}
        <div className="relative p-4 pb-2 bg-slate-950 text-white border-b border-slate-800 shrink-0 flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Share2 className="w-4 h-4" /> 記録をシェア
          </DialogTitle>

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* プレビューエリア */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
          <div className="flex justify-center min-h-min">
            <div className="shadow-2xl rounded-lg overflow-hidden">
              <ShareImage
                ref={imageRef}
                date={date}
                workoutExercises={workoutExercises}
                cardioExercises={cardioExercises}
                exercises={exercises}
                themeColor={color}
                maxWeights={maxWeights}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0 flex gap-3">
          <Button
            onClick={handleSaveImage}
            disabled={isGenerating}
            variant="secondary"
            className="flex-1 bg-slate-800 text-white hover:bg-slate-700 border-slate-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            保存
          </Button>

          {/* シェアボタン (対応ブラウザのみ表示) */}
          {canShare && (
            <Button
              onClick={handleShare}
              disabled={isGenerating}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Share2 className="w-4 h-4 mr-2" />
              )}
              共有
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
