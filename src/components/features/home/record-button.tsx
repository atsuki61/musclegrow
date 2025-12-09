"use client"; // CSS変数を参照する可能性があるためクライアントコンポーネント推奨

import Link from "next/link";
import { Plus } from "lucide-react";

export function RecordButton() {
  return (
    <div className="flex justify-center pt-2 pb-6">
      <Link
        href="/record"
        className="relative group w-full max-w-sm overflow-hidden rounded-2xl shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 active:shadow-sm"
      >
        {/* 
           グラデーションの色をCSS変数ベースに変更
          via-orange-500 -> via-primary/80 などのように、primaryを基準にする
        */}
        <div className="absolute inset-0 bg-linear-to-r from-primary via-primary/80 to-primary bg-size-[200%_100%] bg-left transition-[background-position] duration-500 group-hover:bg-right group-active:bg-right" />

        <div className="relative py-4 px-6 flex items-center justify-center gap-3 text-primary-foreground">
          <div className="p-1 bg-white/20 rounded-full backdrop-blur-sm">
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
