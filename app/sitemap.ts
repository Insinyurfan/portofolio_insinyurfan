import type { MetadataRoute } from "next";

import { NAV_ITEMS } from "@/lib/constants";
import { absoluteUrl } from "@/lib/env";
import { getPublishedProjectSlugs } from "@/lib/queries";

export const revalidate = 300; // = REVALIDATE di lib/constants.ts; Next butuh nilai literal

/**
 * Sitemap dibangun dari database, sehingga proyek baru ikut masuk tanpa
 * perubahan kode. Proyek yang belum terbit tidak muncul karena query-nya
 * memfilter is_published.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublishedProjectSlugs();
  const sekarang = new Date();

  const halamanStatis: MetadataRoute.Sitemap = NAV_ITEMS.map((item) => ({
    url: absoluteUrl(item.href),
    lastModified: sekarang,
    changeFrequency: "monthly",
    priority: item.href === "/" ? 1 : 0.7,
  }));

  const halamanProyek: MetadataRoute.Sitemap = slugs.map(({ slug, updated_at }) => ({
    url: absoluteUrl(`/proyek/${slug}`),
    lastModified: new Date(updated_at),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...halamanStatis, ...halamanProyek];
}
