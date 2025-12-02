"use client";

import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Loader2, X } from "lucide-react";
import { ShareImage } from "./share-image";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { useColorTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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

  // 共有用テキストとURL
  const formattedDate = format(date, "yyyy/MM/dd(E)", { locale: ja });
  const appUrl = "https://musclegrow.vercel.app/";
  const shareText = `📅 ${formattedDate} のトレーニング記録\n\n今日も頑張りました！💪\n#MuscleGrow #筋トレ`;

  // 画像生成 (Blob)
  const generateBlob = async () => {
    if (!imageRef.current) return null;
    const dataUrl = await toPng(imageRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  // 統一された共有・保存ハンドラー（PC/モバイル共通）
  const handleShareAndSave = useCallback(async () => {
    if (!imageRef.current) return;
    try {
      setIsGenerating(true);
      const blob = await generateBlob();
      if (!blob) throw new Error("Blob failed");
      const fileName = `musclegrow_${date.toISOString().split("T")[0]}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // Web Share APIが使える場合はシェアシートを表示（iOSなど）
      if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: "MuscleGrow Log",
          text: shareText,
          url: appUrl,
        });
        // iOSではシェアシートに「画像を保存」が含まれるため、成功メッセージは不要
      } else {
        // Web Share APIが使えない場合は画像をダウンロード
        const dataUrl = await toPng(imageRef.current, {
          cacheBust: true,
          pixelRatio: 2,
        });
        download(dataUrl, fileName);
        toast.success("画像を保存しました");
      }
    } catch (err: unknown) {
      // AbortErrorはユーザーがキャンセルした場合なので無視
      if (err instanceof Error && err.name !== "AbortError") {
        console.error(err);
        toast.error("処理に失敗しました");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [date, shareText, appUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full h-[95dvh] max-h-[900px] p-0 overflow-hidden bg-slate-950 border-slate-800 flex flex-col [&>button]:hidden">
        <div className="relative p-4 pb-2 bg-slate-950 text-white border-b border-slate-800 shrink-0 flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Share2 className="w-4 h-4" /> 記録をシェア
          </DialogTitle>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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

        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <Button
            onClick={handleShareAndSave}
            disabled={isGenerating}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-11"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Share2 className="w-4 h-4 mr-2" />
            )}
            画像を共有・保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
