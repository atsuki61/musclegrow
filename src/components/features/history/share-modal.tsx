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
  Twitter,
  Facebook,
  Mail,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { ShareImage } from "./share-image";
import type { Exercise, SetRecord, CardioRecord } from "@/types/workout";
import { useColorTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

// 修正: ExtendedNavigator の定義を削除 (標準のNavigator型を使用するため)

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

  // 共有用テキストとURL
  const formattedDate = format(date, "yyyy/MM/dd(E)", { locale: ja });
  const appUrl = "https://musclegrow.vercel.app/";
  const shareText = `📅 ${formattedDate} のトレーニング記録\n\n今日も頑張りました！💪\n#MuscleGrow #筋トレ`;

  // Web Share API が使えるかチェック
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      // 修正: 標準のプロパティとしてチェック
      if ("share" in navigator && "canShare" in navigator) {
        setCanShare(true);
      }
    }
  }, []);

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

  // 画像保存
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

  // SNSシェア（リンクのみ + 画像は自動ダウンロード）
  const handleLinkShare = async (
    platform: "twitter" | "facebook" | "email"
  ) => {
    if (!imageRef.current) return;

    try {
      setIsGenerating(true);

      const dataUrl = await toPng(imageRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const fileName = `musclegrow_${date.toISOString().split("T")[0]}.png`;
      download(dataUrl, fileName);

      toast.success("画像を保存しました。投稿に添付してください！", {
        duration: 4000,
      });

      let url = "";
      const text = encodeURIComponent(shareText);
      const link = encodeURIComponent(appUrl);

      switch (platform) {
        case "twitter":
          url = `https://twitter.com/intent/tweet?text=${text}&url=${link}`;
          break;
        case "facebook":
          url = `https://www.facebook.com/sharer/sharer.php?u=${link}`;
          break;
        case "email":
          url = `mailto:?subject=MuscleGrowトレーニング記録&body=${text}%0A${link}`;
          break;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      toast.error("処理に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  // システム共有 (Web Share API)
  const handleSystemShare = useCallback(async () => {
    if (!imageRef.current) return;
    try {
      setIsGenerating(true);
      const blob = await generateBlob();
      if (!blob) throw new Error("Blob failed");
      const fileName = `musclegrow_${date.toISOString().split("T")[0]}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // 修正: 標準のnavigatorをそのまま使用
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

  // URLコピー
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
        {/* ヘッダー */}
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
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0 space-y-4">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-xs text-slate-400 font-bold">共有先を選択</p>

            {/* SNSアイコンリスト */}
            <div className="flex gap-4 justify-center">
              {/* X (Twitter) */}
              <button
                onClick={() => handleLinkShare("twitter")}
                disabled={isGenerating}
                className="flex flex-col items-center gap-2 group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center transition-transform group-hover:scale-110 border border-slate-800">
                  <Twitter className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-200">
                  X
                </span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleLinkShare("facebook")}
                disabled={isGenerating}
                className="flex flex-col items-center gap-2 group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center transition-transform group-hover:scale-110">
                  <Facebook className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-200">
                  Facebook
                </span>
              </button>

              {/* メール */}
              <button
                onClick={() => handleLinkShare("email")}
                disabled={isGenerating}
                className="flex flex-col items-center gap-2 group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-200">
                  メール
                </span>
              </button>

              {/* Web Share API (スマホ/対応ブラウザのみ) */}
              {canShare && (
                <button
                  onClick={handleSystemShare}
                  disabled={isGenerating}
                  className="flex flex-col items-center gap-2 group disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-primary/20">
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <MoreHorizontal className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-200">
                    その他
                  </span>
                </button>
              )}
            </div>

            {/* URLコピー & 画像保存 */}
            <div className="flex flex-col gap-3 mt-2">
              {/* URLコピー */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 pl-3">
                <input
                  readOnly
                  value={appUrl}
                  className="bg-transparent text-xs text-slate-400 flex-1 outline-none"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  size="sm"
                  onClick={copyToClipboard}
                  className={cn(
                    "h-8 text-xs font-bold transition-all px-4 rounded-lg",
                    copied
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" /> コピー済
                    </>
                  ) : (
                    "コピー"
                  )}
                </Button>
              </div>

              {/* 画像保存ボタン */}
              <Button
                onClick={handleSaveImage}
                disabled={isGenerating}
                variant="secondary"
                className="w-full bg-slate-800 text-white hover:bg-slate-700 border-slate-700 font-bold h-11"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                画像を保存のみ
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
