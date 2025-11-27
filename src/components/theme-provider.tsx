"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

// カラーテーマの型定義
export type ColorTheme =
  | "orange"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "monochrome";

interface ColorThemeContextType {
  color: ColorTheme;
  setColor: (color: ColorTheme) => void;
}

const ColorThemeContext = React.createContext<ColorThemeContextType>({
  color: "orange",
  setColor: () => {},
});

export const useColorTheme = () => React.useContext(ColorThemeContext);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [color, setColor] = React.useState<ColorTheme>("orange");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // ローカルストレージからカラー設定を読み込む
    const savedColor = localStorage.getItem(
      "muscle-grow-color-theme"
    ) as ColorTheme;
    if (savedColor) {
      setColor(savedColor);
    }
  }, []);

  // カラー変更時にHTML属性を更新し、保存する
  React.useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute("data-color", color);
    localStorage.setItem("muscle-grow-color-theme", color);
  }, [color, mounted]);

  return (
    <NextThemesProvider {...props}>
      <ColorThemeContext.Provider value={{ color, setColor }}>
        {children}
      </ColorThemeContext.Provider>
    </NextThemesProvider>
  );
}
