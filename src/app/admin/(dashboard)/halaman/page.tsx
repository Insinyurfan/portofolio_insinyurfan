import { PageIntrosManager } from "@/client/components/admin/managers/page-intros-manager";
import { PageHeader } from "@/client/components/admin/ui";
import { adminGetPageIntros } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function PembukaHalamanPage() {
  const items = await adminGetPageIntros();

  return (
    <>
      <PageHeader
        title="Pembuka Halaman"
        description="Blok besar di atas setiap halaman publik. Judul yang dikosongkan berarti blok pembukanya tidak dirender, dan halaman kembali ke bentuk biasa."
      />
      <PageIntrosManager items={items} />
    </>
  );
}
