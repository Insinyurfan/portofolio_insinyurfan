import { PageHeader } from "@/components/admin/ui";
import { SocialLinksManager } from "@/components/admin/managers/social-links-manager";
import { adminGetSocialLinks } from "@/lib/queries-admin";

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
