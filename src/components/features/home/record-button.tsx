import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * 記録ページへの遷移ボタンコンポーネント
 */
export function RecordButton() {
  return (
    <div className="flex justify-center pt-2 pb-6">
      <Link
        href="/record"
        // active:scale-95 によりタップ時に沈み込む演出
        // hover:shadow-xl に加え active:shadow-none で押した感を強調
        className="relative group w-full max-w-sm overflow-hidden rounded-2xl shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 active:shadow-sm"
      >
        {/* 
          背景グラデーションアニメーション
          bg-[length:200%_100%] : 横幅を2倍にしてグラデーションを流す準備
          bg-left -> bg-right : ホバー/アクティブ時に位置を移動
          group-active:bg-right : スマホのタップ時にもアニメーションさせる
        */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-primary bg-[length:200%_100%] bg-left transition-[background-position] duration-500 group-hover:bg-right group-active:bg-right" />

        <div className="relative py-4 px-6 flex items-center justify-center gap-3 text-primary-foreground">
          <div className="p-1 bg-white/20 rounded-full backdrop-blur-sm">
            {/* アイコン回転: ホバー時とタップ時(active)両方で回転 */}
            <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90 group-active:rotate-90 stroke-[3px]" />
          </div>
          <span className="font-bold text-lg tracking-wide">
            トレーニングを記録
          </span>
        </div>
      </Link>
    </div>
  );
}
