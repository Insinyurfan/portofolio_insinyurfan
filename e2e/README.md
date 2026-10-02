# Verifikasi ujung ke ujung

Tiga skrip Playwright yang menguji aplikasi lewat browser sungguhan.

Skrip ini **bukan** bagian dari rencana awal (design.md menyebut pengujian
otomatis sebagai non-goal). Ia ditambahkan saat implementasi karena verifikasi
lewat HTTP saja tidak cukup — dan ternyata menemukan empat bug yang tidak
terlihat dari `next build`, `tsc`, maupun `curl`:

1. `lib/env.ts` membaca `process.env[nama]` dengan kunci dinamis, sehingga
   variabel `NEXT_PUBLIC_*` tidak ter-inline ke bundel peramban dan halaman
   login mati saat dihidrasi.
2. Policy Storage memberi `authenticated` hak hapus tanpa hak baca, sehingga
   `remove()` melaporkan sukses tanpa menghapus berkas apa pun.
3. Dashboard admin ikut mewarisi navbar dan footer situs publik, karena
   layout-nya bersarang di root layout.
4. `TimelineItem` merender `<li>` di dalam `<li>`, yang membuat hydration
   gagal di build produksi pada halaman Pendidikan dan Pengalaman.

## Menjalankan

Butuh server yang sudah berjalan, dan `.env.local` yang memuat
`ADMIN_TEMP_PASSWORD` (atau password admin Anda).

```bash
npm run build
npm start -- --port 3020          # di terminal lain

npm run e2e:publik                # halaman publik
npm run e2e:admin                 # login, CRUD, dialog, toast, pengurutan
npm run e2e:admin-konten          # proyek, slug, unggah, cascade, regresi
```

Ketiganya menerima nomor port sebagai argumen, bawaannya `3020`.

## Catatan

- `admin-konten.mjs` membuat lalu menghapus data uji. Setelah selesai,
  jumlah baris kembali seperti semula.
- Jangan dijalankan terhadap database produksi yang sudah berisi konten asli.
