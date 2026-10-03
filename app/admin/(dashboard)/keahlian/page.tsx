import { PageHeader } from "@/components/admin/ui";
import { SkillsManager } from "@/components/admin/managers/skills-manager";
import { adminGetSkillCategories, adminGetSkills } from "@/lib/queries-admin";

export const dynamic = "force-dynamic";

export default async function KeahlianAdminPage() {
  const [categories, skills] = await Promise.all([
    adminGetSkillCategories(),
    adminGetSkills(),
  ]);

  return (
    <>
      <PageHeader
        title="Keahlian"
        description="Setiap keahlian berada di bawah sebuah kategori. Kategori tanpa keahlian terbit tidak dirender di halaman publik."
      />
      <SkillsManager categories={categories} skills={skills} />
    </>
  );
}
