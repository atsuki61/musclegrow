// src/hooks/use-theme-colors.ts
"use client";

import { useEffect, useState } from "react";
import { useColorTheme } from "@/components/theme-provider";

export function useThemeColors() {
  const { color } = useColorTheme();
  // 初期値（オレンジ）
  const [primaryColor, setPrimaryColor] = useState("oklch(0.705 0.213 47.604)");

  useEffect(() => {
    // 現在のCSS変数 --primary の値を取得してJSで使える形式に変換
    // ※ oklch関数がブラウザによってはCanvas等で直接使えない場合があるため、
    // ここでは簡易的に色が変わるトリガーとして機能させ、
    // 実際の色指定はCSS変数経由か、hsl等への変換ロジックを入れるのがベストですが、
    // RechartsはCSS変数文字列をstrokeに渡しても動くケースが多いです。
    // もし動かない場合は、getComputedStyleでhexを取得する必要があります。

    const root = document.documentElement;
    const style = getComputedStyle(root);
    const primary = style.getPropertyValue("--primary").trim();
    if (primary) {
      // oklch(...) のままだとRechartsが解釈できない場合があるので
      // 念のためhslに変換するか、tailwindの解決済みcolorを使うのが安全
      // 一旦CSS変数ラッパーを返します
      setPrimaryColor(`var(--primary)`);
    }
  }, [color]);

  return { primary: primaryColor };
}
