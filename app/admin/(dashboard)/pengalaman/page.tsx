import { PageHeader } from "@/components/admin/ui";
import { ExperiencesManager } from "@/components/admin/managers/experiences-manager";
import { adminGetExperiences } from "@/lib/queries-admin";

export const dynamic = "force-dynamic";

export default async function PengalamanAdminPage() {
  const items = await adminGetExperiences();

  return (
    <>
      <PageHeader
        title="Pengalaman"
        description="Pengalaman kerja, magang, organisasi, dan freelance."
      />
      <ExperiencesManager items={items} />
    </>
  );
}
