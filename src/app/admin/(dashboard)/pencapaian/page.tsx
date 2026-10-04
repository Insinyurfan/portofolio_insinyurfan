import { PageHeader } from "@/client/components/admin/ui";
import { AchievementsManager } from "@/client/components/admin/managers/achievements-manager";
import { adminGetAchievements } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function PencapaianAdminPage() {
  const items = await adminGetAchievements();

  return (
    <>
      <PageHeader
        title="Pencapaian"
        description="Sertifikat dan penghargaan yang tampil sebagai grid di halaman publik."
      />
      <AchievementsManager items={items} />
    </>
  );
}
