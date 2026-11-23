"use client";

import { useLayoutEffect, useRef, useState } from "react";

export function useScrollKeForm() {
  const ref = useRef<HTMLElement>(null);
  const [permintaan, setPermintaan] = useState(0);

  useLayoutEffect(() => {
    const panel = ref.current;
    if (permintaan === 0 || !panel) return;

    if (!panel.contains(document.activeElement)) {
      panel.focus({ preventScroll: true });
    }
    panel.scrollIntoView({ block: "start" });
  }, [permintaan]);

  return {
    panel: { ref, tabIndex: -1, className: "scroll-mt-4" },
    versiForm: permintaan,
    arahkan: () => setPermintaan((nilai) => nilai + 1),
  };
}
