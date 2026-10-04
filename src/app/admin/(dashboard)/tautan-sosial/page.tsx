import { PageHeader } from "@/client/components/admin/ui";
import { SocialLinksManager } from "@/client/components/admin/managers/social-links-manager";
import { adminGetSocialLinks } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function TautanSosialPage() {
  const items = await adminGetSocialLinks();

  return (
    <>
      <PageHeader
        title="Tautan Sosial"
        description="Ikon yang tampil di beranda dan footer. Urutannya menentukan urutan tampil."
      />
      <SocialLinksManager items={items} />
    </>
  );
}
