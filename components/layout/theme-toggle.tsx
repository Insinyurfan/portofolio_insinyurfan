"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Toggle terang/gelap.
 *
 * Sebelum hidrasi, next-themes belum tahu tema yang berlaku dan
 * `resolvedTheme` masih undefined. Itu dipakai langsung sebagai penanda
 * "belum siap", jadi tidak perlu state mounted sendiri — dan placeholder
 * berukuran sama mencegah pergeseran tata letak.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  if (resolvedTheme === undefined) {
    return <span className="size-9" aria-hidden="true" />;
  }

  const gelap = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(gelap ? "light" : "dark")}
      className="inline-flex size-9 items-center justify-center rounded-pill border border-border-subtle text-text-muted transition-colors hover:border-accent hover:text-accent"
      aria-label={gelap ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
    >
      {gelap ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
