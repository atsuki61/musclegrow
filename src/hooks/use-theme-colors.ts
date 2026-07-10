// src/hooks/use-theme-colors.ts
"use client";

import { useColorTheme } from "@/components/theme-provider";

export function useThemeColors() {
  useColorTheme();

  return { primary: "var(--primary)" };
}
