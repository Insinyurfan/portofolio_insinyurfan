import { PageHeader } from "@/client/components/admin/ui";
import { AchievementsManager } from "@/client/components/admin/managers/achievements-manager";
import { adminGetAchievements } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function SertifikatAdminPage() {
  const items = await adminGetAchievements();

  return (
    <>
      <PageHeader
        title="Sertifikat"
        description="Kelompokkan sertifikat berdasarkan kegiatan dan unggah berkas PDF atau gambar."
      />
      <AchievementsManager items={items} />
    </>
  );
}
