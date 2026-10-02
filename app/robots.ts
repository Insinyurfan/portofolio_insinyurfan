import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/env";

/**
 * Mengizinkan perayapan halaman publik dan menunjuk sitemap dengan URL absolut.
 *
 * /admin sudah dilarang sejak sekarang: dashboard admin dibangun di change
 * berikutnya, dan tidak ada gunanya halaman itu pernah terindeks.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
