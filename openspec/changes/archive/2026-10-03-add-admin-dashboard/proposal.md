## Why

Change `setup-portfolio-public-site` membuat halaman publik membaca seluruh kontennya dari database, tetapi tidak ada cara mengisi atau mengubah konten itu selain menulis SQL langsung. Portofolio jadi tidak bisa dirawat oleh pemiliknya sendiri. Change ini menambahkan dashboard admin terproteksi login sebagai satu-satunya cara normal mengelola konten, sekaligus memakai kebijakan RLS "pengguna terautentikasi dapat mengubah semua baris" yang sudah dibuat di change sebelumnya.

Change ini bergantung pada `setup-portfolio-public-site` dan SHALL diimplementasi serta diarsipkan setelahnya — skema, RLS, bucket Storage, dan lapisan query yang dipakai di sini lahir di change tersebut.

## What Changes

**Autentikasi admin**
- Halaman `/admin/login` memakai Supabase Auth dengan email dan password.
- Sesi dijaga lewat cookie dan diperbarui di middleware; seluruh route `/admin/*` ditolak bagi pengunjung yang belum login.
- Hanya satu akun admin: signup dinonaktifkan di Supabase, akun dibuat manual, dan email sesi diverifikasi terhadap `ADMIN_EMAIL` di middleware maupun di setiap aksi tulis. Tidak ada halaman registrasi publik.
- Tombol logout mengakhiri sesi dan mengembalikan ke halaman login.

**Dashboard**
- Halaman ringkasan: jumlah proyek, jumlah pesan belum dibaca, jumlah rating menunggu persetujuan, dan tautan cepat ke setiap bagian.
- CRUD penuh untuk `profile`, `social_links`, `education`, `skill_categories` + `skills`, `experiences`, `projects`, dan `achievements`.
- Validasi form dengan zod di sisi server maupun klien, dengan pesan error berbahasa Indonesia per field.
- Toggle terbit/sembunyikan per item, dan pengurutan lewat tombol naik/turun.
- Konfirmasi sebelum menghapus, dan notifikasi toast setelah setiap aksi berhasil maupun gagal.
- Unggah gambar ke Supabase Storage dengan pratinjau; berkas lama dihapus saat diganti.
- Editor profil: ganti foto, bio, daftar role untuk animasi ketik, dan unggah CV berkas PDF yang menggantikan berkas lama.
- Inbox pesan (baca, tandai sudah/belum dibaca, hapus) dan moderasi rating (setujui, cabut persetujuan, hapus).
- Setiap perubahan memanggil `revalidatePath` sehingga halaman publik yang terdampak langsung diperbarui tanpa menunggu ISR.

**Perubahan model data**
- Tabel `messages` mendapat penanda sudah dibaca, dan kolom-kolomnya dirinci secara eksplisit — change sebelumnya hanya menyebut tabel ini "pesan dari form kontak" tanpa menetapkan kolom maupun penanda dibaca, sehingga hitungan "pesan belum dibaca" belum punya dasar.

**UI admin**
- Layout sidebar yang responsif, netral, dan fungsional, dengan komponen dari shadcn/ui. Sengaja tidak mengikuti arah visual bento grid halaman publik.

**Non-goals (change berikutnya)**
- Form kontak publik dan pengiriman rating oleh pengunjung — admin baru bisa mengelola pesan dan rating yang masuk lewat jalur lain sampai form itu ada.
- Menampilkan rating yang disetujui di halaman publik.
- Pratinjau konten belum terbit di halaman publik.
- Lebih dari satu akun admin, peran bertingkat, dan log audit.

## Capabilities

### New Capabilities
- `admin-auth`: Login email/password, siklus hidup sesi, proteksi route `/admin/*`, penegakan satu akun admin, dan logout.
- `admin-shell`: Kerangka dashboard — layout sidebar responsif, navigasi, toast, dan dialog konfirmasi yang dipakai seluruh halaman admin.
- `admin-overview`: Halaman ringkasan berisi jumlah proyek, pesan belum dibaca, dan rating menunggu persetujuan.
- `admin-content-management`: CRUD, validasi, toggle terbit, dan pengurutan untuk profil, tautan sosial, pendidikan, keahlian, pengalaman, proyek, dan pencapaian.
- `admin-media`: Unggah gambar dan PDF ke Storage dengan pratinjau, penggantian berkas, dan pembersihan berkas lama.
- `admin-inbox`: Inbox pesan dengan penanda sudah dibaca, dan moderasi rating.
- `admin-revalidation`: Pembaruan halaman publik yang terdampak segera setelah aksi admin berhasil.

### Modified Capabilities
- `portfolio-content-model`: menambahkan rincian kolom tabel `messages` dan penanda sudah dibaca, yang dibutuhkan untuk hitungan pesan belum dibaca dan inbox admin. Tidak ada perilaku yang sudah ditetapkan di change sebelumnya yang berubah.

## Impact

- **Kode**: route group `/admin` baru beserta middleware di root; lapisan mutasi baru di sisi server; lapisan query admin yang membaca termasuk baris belum terbit, terpisah dari query publik yang hanya membaca yang terbit.
- **Dependensi baru**: `@supabase/ssr` (sesi berbasis cookie), `zod`, pustaka form, dan komponen shadcn/ui beserta peer dependency-nya.
- **Variabel lingkungan baru**: `ADMIN_EMAIL`. Ditambahkan ke `.env.example` dan ke bagian deploy di README.
- **Migrasi database**: satu migrasi menambah kolom pada `messages`.
- **Konfigurasi Supabase**: signup harus dinonaktifkan di pengaturan Auth proyek, dan akun admin dibuat manual. Keduanya langkah manual yang didokumentasikan di README.
- **Halaman publik**: tidak ada perubahan perilaku. Halaman publik tetap hanya membaca konten terbit dan tetap memakai ISR; `revalidatePath` hanya mempercepat munculnya perubahan.
- **Prasyarat**: `setup-portfolio-public-site` harus sudah diimplementasi dan diarsipkan lebih dulu.
