import { PageHeader } from "@/components/admin/ui";
import { RatingsManager } from "@/components/admin/managers/ratings-manager";
import { adminGetRatings } from "@/lib/queries-admin";

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
