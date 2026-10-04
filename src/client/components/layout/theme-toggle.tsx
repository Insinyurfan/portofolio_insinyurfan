"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { useMounted } from "@/client/hooks/use-mounted";

/**
 * Toggle terang/gelap.
 *
 * Tema yang berlaku hanya diketahui di peramban, jadi sebelum terpasang
 * komponen ini merender placeholder berukuran sama — itu mencegah pergeseran
 * tata letak.
 *
 * Penanda terpasang diambil dari `useMounted`, yang memakai
 * `useSyncExternalStore`. Memeriksa `resolvedTheme === undefined` saja TIDAK
 * cukup: next-themes sudah mengetahui temanya pada render pertama di klien,
 * sehingga server mengirim `<span>` sementara klien merender `<button>` —
 * dan React melaporkannya sebagai hydration mismatch.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const sudahTerpasang = useMounted();

  if (!sudahTerpasang) {
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
