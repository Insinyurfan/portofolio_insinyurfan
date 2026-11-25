import { PageHeader } from "@/client/components/admin/ui";
import { ExperiencesManager } from "@/client/components/admin/managers/experiences-manager";
import { adminGetExperiences } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function PengalamanAdminPage() {
  const items = await adminGetExperiences();

  return (
    <>
      <PageHeader
        title="Pengalaman"
        description="Di situs publik, pengalaman diurutkan dari tanggal mulai terlama. Urutan manual berlaku untuk tanggal mulai yang sama."
      />
      <ExperiencesManager items={items} />
    </>
  );
}
