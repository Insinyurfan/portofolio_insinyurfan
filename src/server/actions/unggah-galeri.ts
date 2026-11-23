"use server";

import { z } from "zod";

import { withAdminAction } from "@/server/actions/admin";
import { PREFIKS_MEDIA, siapkanUnggahGambar } from "@/server/actions/storage";

export const siapkanUnggahGaleriAction = withAdminAction(
  z.object({
    prefiks: z.enum(PREFIKS_MEDIA),
    type: z.string(),
    size: z.number().int().nonnegative(),
  }),
  ({ prefiks, type, size }) => siapkanUnggahGambar({ type, size }, prefiks),
  { sukses: "Unggahan siap." },
);
