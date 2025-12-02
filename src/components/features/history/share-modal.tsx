"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";
import download from "downloadjs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Loader2,
  Download,
  X,
  Check,
  Link as LinkIcon,
} from "lucide-react";
import { ShareImage } from "./share-image";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { useColorTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [copied, setCopied] = useState(false);

  const formattedDate = format(date, "yyyy/MM/dd(E)", { locale: ja });
  const appUrl = "https://musclegrow.vercel.app/";
  const shareText = `📅 ${formattedDate} のトレーニング記録\n\n今日も頑張りました！💪\n#MuscleGrow #筋トレ`;

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      if ("share" in navigator && "canShare" in navigator) {
        setCanShare(true);
      }
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
    } catch (err) {
      console.error(err);
      toast.error("画像の生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  }, [date]);

  const handleSystemShare = useCallback(async () => {
    if (!imageRef.current) return;
    try {
      setIsGenerating(true);
      const blob = await generateBlob();
      if (!blob) throw new Error("Blob failed");
      const fileName = `musclegrow_${date.toISOString().split("T")[0]}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (
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
        toast.success("共有しました");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error(err);
        toast.error("共有できませんでした");
      }
    } finally {
      setIsGenerating(false);
    }
  }, [date, shareText, appUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success("リンクをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("コピーに失敗しました");
    }
  };

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

        {/* フッター */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0 space-y-3">
          {canShare ? (
            // スマホ (Web Share API 対応)
            <>
              <Button
                onClick={handleSystemShare}
                disabled={isGenerating}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12 shadow-lg shadow-primary/10 text-base"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Share2 className="w-5 h-5 mr-2" />
                )}
                画像を共有・保存
              </Button>

              <Button
                onClick={copyToClipboard}
                variant="ghost"
                className={cn(
                  "w-full font-medium transition-colors h-9 text-xs",
                  copied
                    ? "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1.5" /> リンクをコピーしました
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3 h-3 mr-1.5" /> 記録のリンクをコピー
                  </>
                )}
              </Button>
            </>
          ) : (
            // PC (Web Share API 非対応)
            <div className="flex gap-3">
              <Button
                onClick={handleSaveImage}
                disabled={isGenerating}
                variant="secondary"
                className="flex-1 bg-slate-800 text-white hover:bg-slate-700 border-slate-700 font-bold h-11"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                画像を保存
              </Button>

              <Button
                onClick={copyToClipboard}
                variant="secondary"
                className={cn(
                  "flex-1 font-bold border-slate-700 transition-colors h-11",
                  copied
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-slate-800 hover:bg-slate-700 text-white"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" /> コピー済
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" /> リンク
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
