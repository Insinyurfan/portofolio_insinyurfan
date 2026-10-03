import { PageHeader } from "@/components/admin/ui";
import { AchievementsManager } from "@/components/admin/managers/achievements-manager";
import { adminGetAchievements } from "@/lib/queries-admin";

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
