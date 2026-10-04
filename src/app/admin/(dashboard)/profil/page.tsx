import { PageHeader } from "@/client/components/admin/ui";
import { ProfileManager } from "@/client/components/admin/managers/profile-manager";
import { adminGetProfile } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const profile = await adminGetProfile();

  return (
    <>
      <PageHeader
        title="Profil"
        description="Identitas Anda di seluruh situs. Perubahan di sini memengaruhi semua halaman publik."
      />
      <ProfileManager profile={profile} />
    </>
  );
}
