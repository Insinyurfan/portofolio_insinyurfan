"use server";

import { z } from "zod";

import { withAdminAction } from "@/server/actions/admin";
import { PREFIKS_MEDIA, siapkanUnggahMedia } from "@/server/actions/storage";

export const siapkanUnggahMediaAction = withAdminAction(
  z.object({
    prefiks: z.enum(PREFIKS_MEDIA),
    type: z.string(),
    size: z.number().int().nonnegative(),
    jenis: z.enum(["gambar", "pdf"]),
  }),
  ({ prefiks, type, size, jenis }) => siapkanUnggahMedia({ type, size }, prefiks, jenis),
  { sukses: "Unggahan siap." },
);
