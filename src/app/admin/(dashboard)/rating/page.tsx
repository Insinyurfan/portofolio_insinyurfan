import { PageHeader } from "@/client/components/admin/ui";
import { RatingsManager } from "@/client/components/admin/managers/ratings-manager";
import { adminGetRatings } from "@/server/db/queries-admin";

export const dynamic = "force-dynamic";

export default async function RatingPage() {
  const items = await adminGetRatings();

  return (
    <>
      <PageHeader
        title="Rating"
        description="Rating hanya tampil di halaman publik setelah Anda setujui."
      />
      <RatingsManager items={items} />
    </>
  );
}
