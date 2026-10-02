import { PageHeader } from "@/components/admin/ui";
import { EducationManager } from "@/components/admin/managers/education-manager";
import { adminGetEducation } from "@/lib/queries-admin";

export const dynamic = "force-dynamic";

export default async function PendidikanAdminPage() {
  const items = await adminGetEducation();

  return (
    <>
      <PageHeader
        title="Pendidikan"
        description="Timeline di halaman Pendidikan. Urutannya mengikuti urutan daftar ini."
      />
      <EducationManager items={items} />
    </>
  );
}
