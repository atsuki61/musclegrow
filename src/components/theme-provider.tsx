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

const COLOR_STORAGE_KEY = "muscle-grow-color-theme";

const COLOR_THEMES: readonly ColorTheme[] = [
  "orange",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "monochrome",
];

function isColorTheme(value: string | null): value is ColorTheme {
  return value !== null && COLOR_THEMES.some((theme) => theme === value);
}

const colorThemeListeners = new Set<() => void>();

function subscribeColorTheme(onStoreChange: () => void) {
  colorThemeListeners.add(onStoreChange);
  return () => {
    colorThemeListeners.delete(onStoreChange);
  };
}

function notifyColorThemeChange() {
  colorThemeListeners.forEach((listener) => listener());
}

function readColorThemeFromStorage(): ColorTheme {
  if (typeof window === "undefined") return "orange";
  const savedColor = localStorage.getItem(COLOR_STORAGE_KEY);
  return isColorTheme(savedColor) ? savedColor : "orange";
}

const ColorThemeContext = React.createContext<ColorThemeContextType>({
  color: "orange",
  setColor: () => {},
});

export const useColorTheme = () => React.useContext(ColorThemeContext);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const color = React.useSyncExternalStore<ColorTheme>(
    subscribeColorTheme,
    readColorThemeFromStorage,
    () => "orange",
  );

  const setColor = React.useCallback((newColor: ColorTheme) => {
    localStorage.setItem(COLOR_STORAGE_KEY, newColor);
    notifyColorThemeChange();
  }, []);

  // 外部 DOM（document.documentElement）へ data-color を同期
  React.useEffect(() => {
    document.documentElement.setAttribute("data-color", color);
  }, [color]);

  return (
    <NextThemesProvider {...props}>
      <ColorThemeContext.Provider value={{ color, setColor }}>
        {children}
      </ColorThemeContext.Provider>
    </NextThemesProvider>
  );
}
