/**
 * Kerangka muat untuk seluruh halaman dashboard.
 *
 * Setiap halaman admin `force-dynamic`, sehingga isinya baru ada setelah
 * server selesai memeriksa sesi dan menjalankan query — terukur sekitar 330 ms
 * di produksi. Tanpa berkas ini, Next menahan tampilan lama selama itu dan
 * klik terasa tidak menghasilkan apa-apa.
 *
 * Dengan berkas ini, Next langsung menukar isinya begitu tautan diklik.
 * Waktunya tidak berubah; yang berubah adalah tidak ada lagi jeda diam.
 *
 * Bentuknya sengaja meniru PageHeader beserta daftar di bawahnya, supaya
 * pergantian ke isi sungguhan tidak membuat tata letak melompat.
 */
export default function MemuatDashboard() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Memuat halaman…</span>

      {/* Tiruan PageHeader: judul dan keterangan. */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="w-full max-w-md">
          <div className="h-7 w-40 animate-pulse rounded-adm bg-adm-panel-muted" />
          <div className="mt-2 h-4 w-full animate-pulse rounded-adm bg-adm-panel-muted" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-adm bg-adm-panel-muted" />
      </div>

      {/* Tiruan daftar isi. */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-adm border border-adm-border bg-adm-panel p-4"
          >
            <div className="h-5 w-1/3 animate-pulse rounded-adm bg-adm-panel-muted" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded-adm bg-adm-panel-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
