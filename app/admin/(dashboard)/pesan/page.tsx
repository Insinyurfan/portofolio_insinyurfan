import { PageHeader } from "@/components/admin/ui";
import { MessagesManager } from "@/components/admin/managers/messages-manager";
import { adminGetMessages } from "@/lib/queries-admin";

export const dynamic = "force-dynamic";

export default async function PesanPage() {
  const items = await adminGetMessages();

  return (
    <>
      <PageHeader
        title="Pesan"
        description="Pesan masuk dari form kontak. Membuka sebuah pesan menandainya sudah dibaca."
      />
      <MessagesManager items={items} />
    </>
  );
}
