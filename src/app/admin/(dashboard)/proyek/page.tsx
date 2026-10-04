import { PageHeader } from "@/client/components/admin/ui";
import { ProjectsManager } from "@/client/components/admin/managers/projects-manager";
import { adminGetProjects } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function ProyekAdminPage() {
  const items = await adminGetProjects();

  return (
    <>
      <PageHeader
        title="Proyek"
        description="Mengubah slug akan mengubah alamat halaman detailnya. Proyek featured ikut tampil di beranda."
      />
      <ProjectsManager items={items} />
    </>
  );
}
