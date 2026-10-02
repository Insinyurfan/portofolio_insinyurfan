"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * next-themes dipakai karena syarat "tanpa kedipan" menuntut class tema sudah
 * tertulis sebelum paint pertama. Lihat design.md → "next-themes untuk tema".
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
