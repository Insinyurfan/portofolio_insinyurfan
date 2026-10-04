# Verifikasi ujung ke ujung

Lima skrip Playwright yang menguji aplikasi lewat browser sungguhan.

Skrip ini **bukan** bagian dari rencana awal (design.md menyebut pengujian
otomatis sebagai non-goal). Ia ditambahkan saat implementasi karena verifikasi
lewat HTTP saja tidak cukup — dan ternyata menemukan tujuh bug yang tidak
terlihat dari `next build`, `tsc`, maupun `curl`:

1. `src/shared/env.ts` membaca `process.env[nama]` dengan kunci dinamis, sehingga
   variabel `NEXT_PUBLIC_*` tidak ter-inline ke bundel peramban dan halaman
   login mati saat dihidrasi.
2. Policy Storage memberi `authenticated` hak hapus tanpa hak baca, sehingga
   `remove()` melaporkan sukses tanpa menghapus berkas apa pun.
3. Dashboard admin ikut mewarisi navbar dan footer situs publik, karena
   layout-nya bersarang di root layout.
4. `TimelineItem` merender `<li>` di dalam `<li>`, yang membuat hydration
   gagal di build produksi pada halaman Pendidikan dan Pengalaman.
5. Honeypot form publik tidak berfungsi: nilainya dibaca dari state internal
   react-hook-form, bukan dari DOM, sehingga isian bot tidak pernah terbaca.
6. Form login memakai klien Supabase peramban, yang menulis cookie sesi
   setelah navigasi ke `/admin` sudah berjalan — proxy belum melihat sesinya
   dan memantulkan admin kembali ke beranda. Pantulan itu hanya terjadi
   sekali, jadi tidak terlihat dari percobaan manual yang langsung dimuat
   ulang.
7. Kerangka admin memilih tampilan berdasarkan `usePathname()`, yang di
   alamat masuk rahasia mengembalikan alamat rahasianya — bukan
   `/admin/login`. Sidebar lengkap ikut dirender di halaman masuk, dan
   prefetch Next ke setiap tautannya menimpa cookie tujuan.

## Menjalankan

Butuh server yang sudah berjalan, dan `.env.local` yang memuat
`ADMIN_TEMP_PASSWORD` (atau password admin Anda) serta `ADMIN_LOGIN_PATH`.

Alamat masuk dibaca dari env oleh `helpers.mjs`, tidak ditulis keras di
skripnya — `/admin/login` sengaja tidak dapat dibuka langsung.

```bash
npm run build
npm start -- --port 3020          # di terminal lain

npm run e2e:publik                # halaman publik
npm run e2e:admin                 # login, CRUD, dialog, toast, pengurutan
npm run e2e:admin-konten          # proyek, slug, unggah, cascade, regresi
npm run e2e:form                  # kontak, rating, pratinjau CV, batas laju
npm run e2e:produksi              # terhadap deployment produksi
```

Semuanya menerima nomor port sebagai argumen, bawaannya `3020`.

## Catatan

- `admin-konten.mjs` membuat lalu menghapus data uji. Setelah selesai,
  jumlah baris kembali seperti semula.
- `publik-form.mjs` mengosongkan penghitung pembatasan laju lebih dulu.
  Tanpa itu, menjalankannya beberapa kali akan menghabiskan kuota 5/jam
  milik pengirim uji dan tes berikutnya gagal karena alasan yang salah.
- Jangan dijalankan terhadap database produksi yang sudah berisi konten asli.
