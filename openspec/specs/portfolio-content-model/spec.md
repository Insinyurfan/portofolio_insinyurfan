# portfolio-content-model Specification

## Purpose
Mendefinisikan sumber kebenaran untuk seluruh konten portofolio: tabel, kolom, relasi, aturan publikasi, kebijakan akses baris, penyimpanan berkas, dan data contoh. Semua konten yang tampil di situs berasal dari sini, tidak ada konten yang ditulis langsung di kode.

## Requirements

### Requirement: Konten portofolio disimpan di database

Sistem SHALL menyimpan seluruh konten portofolio di PostgreSQL (Supabase) pada tabel `profile`, `social_links`, `education`, `skill_categories`, `skills`, `experiences`, `projects`, `achievements`, `messages`, dan `ratings`. Tidak ada teks konten, daftar skill, daftar proyek, atau tautan sosial yang boleh ditulis langsung (hardcode) di kode aplikasi.

#### Scenario: Konten diubah di database tanpa deploy ulang

- **WHEN** sebuah baris konten diubah di database dan periode revalidasi halaman terlampaui
- **THEN** halaman publik menampilkan nilai yang baru tanpa perlu mengubah atau mendeploy ulang kode

#### Scenario: Tidak ada konten fallback di kode

- **WHEN** seluruh tabel konten dikosongkan
- **THEN** halaman publik tetap dapat dirender dan menampilkan empty state, bukan teks contoh yang tertanam di kode

### Requirement: Kolom audit dan status publikasi pada setiap tabel

Setiap tabel konten SHALL memiliki kolom `id` (UUID, primary key), `created_at` (timestamptz, default waktu sekarang), `updated_at` (timestamptz, default waktu sekarang), dan `is_published` (boolean, default `true` untuk tabel konten). Kolom `updated_at` SHALL diperbarui otomatis oleh database setiap kali baris diubah.

#### Scenario: updated_at diperbarui otomatis

- **WHEN** sebuah baris pada tabel konten diperbarui
- **THEN** nilai `updated_at` baris tersebut menjadi waktu saat pembaruan terjadi, tanpa perlu dikirim oleh pemanggil

#### Scenario: Baris baru otomatis terbit

- **WHEN** sebuah baris konten dibuat tanpa menyertakan `is_published`
- **THEN** baris tersebut tersimpan dengan `is_published = true`

### Requirement: Profil adalah satu baris tunggal

Tabel `profile` SHALL berisi paling banyak satu baris. Tabel ini SHALL menyimpan nama lengkap, username, daftar role/headline (banyak nilai berurutan), tagline, URL foto, bio "Tentang Saya", lokasi, email, status terbuka untuk pekerjaan (boolean), dan URL berkas CV. Field selain nama lengkap dan username MAY kosong.

#### Scenario: Penambahan profil kedua ditolak

- **WHEN** sebuah baris `profile` kedua dicoba disisipkan sementara satu baris sudah ada
- **THEN** database menolak operasi tersebut dengan error constraint

#### Scenario: Beberapa role tersimpan berurutan

- **WHEN** profil disimpan dengan beberapa role/headline
- **THEN** seluruh role dapat dibaca kembali dalam urutan yang sama seperti saat disimpan

### Requirement: Konten berurutan dapat ditentukan urutannya

Tabel `social_links`, `education`, `skill_categories`, `skills`, `experiences`, dan `projects` SHALL memiliki kolom urutan numerik (`sort_order`) yang menentukan urutan tampil. Pembacaan untuk situs publik SHALL mengurutkan berdasarkan kolom ini, dengan pengurutan sekunder yang deterministik.

#### Scenario: Urutan tampil mengikuti sort_order

- **WHEN** beberapa baris pada satu tabel berurutan dibaca untuk ditampilkan
- **THEN** baris dikembalikan menurut `sort_order` naik

#### Scenario: Nilai sort_order kembar tetap deterministik

- **WHEN** dua baris memiliki `sort_order` yang sama
- **THEN** urutan keduanya tetap konsisten antar permintaan karena adanya pengurutan sekunder

### Requirement: Skill dikelompokkan per kategori

Tabel `skills` SHALL merujuk ke `skill_categories` melalui foreign key. Menghapus sebuah kategori SHALL juga menghapus skill di dalamnya. Baik kategori maupun skill SHALL menyimpan nama, ikon opsional, dan urutan.

#### Scenario: Skill terbaca bersama kategorinya

- **WHEN** daftar skill dibaca untuk halaman publik
- **THEN** setiap skill menyertakan kategori induknya, dan kategori dikembalikan menurut urutannya

#### Scenario: Menghapus kategori menghapus skill-nya

- **WHEN** sebuah baris `skill_categories` dihapus
- **THEN** semua baris `skills` yang merujuk kategori tersebut juga terhapus

### Requirement: Pengalaman memiliki tipe dan penanda masih berjalan

Tabel `experiences` SHALL menyimpan posisi, instansi, tipe, tanggal mulai, tanggal selesai opsional, penanda masih berjalan (boolean), deskripsi, dan urutan. Tipe SHALL dibatasi pada nilai yang mewakili pekerjaan, magang, organisasi, dan freelance.

#### Scenario: Tipe di luar daftar ditolak

- **WHEN** sebuah baris `experiences` disisipkan dengan tipe di luar daftar yang diizinkan
- **THEN** database menolak operasi tersebut

#### Scenario: Pengalaman yang masih berjalan tanpa tanggal selesai

- **WHEN** sebuah pengalaman ditandai masih berjalan dan tanggal selesainya kosong
- **THEN** baris tersebut tersimpan dan dapat dibaca kembali tanpa error

### Requirement: Proyek memiliki slug unik dan penanda featured

Tabel `projects` SHALL menyimpan judul, slug, ringkasan, deskripsi lengkap, daftar tech stack (banyak nilai), URL thumbnail, galeri URL gambar (banyak nilai), link demo opsional, link repositori opsional, penanda `featured` (boolean), dan urutan. Slug SHALL unik dan aman untuk URL.

#### Scenario: Slug duplikat ditolak

- **WHEN** sebuah proyek disisipkan dengan slug yang sudah dipakai proyek lain
- **THEN** database menolak operasi tersebut dengan pelanggaran unique constraint

#### Scenario: Proyek featured dapat difilter

- **WHEN** proyek dengan `featured = true` diminta
- **THEN** hanya proyek featured yang terbit yang dikembalikan, menurut urutannya

### Requirement: Pencapaian memiliki kategori dan tautan verifikasi

Tabel `achievements` SHALL menyimpan judul, penerbit, tanggal, kategori, URL gambar/berkas, dan URL verifikasi opsional. Kategori SHALL dibatasi pada nilai yang mewakili sertifikat dan penghargaan.

#### Scenario: Kategori di luar daftar ditolak

- **WHEN** sebuah baris `achievements` disisipkan dengan kategori di luar daftar yang diizinkan
- **THEN** database menolak operasi tersebut

#### Scenario: Pencapaian tanpa tautan verifikasi

- **WHEN** sebuah pencapaian disimpan tanpa URL verifikasi
- **THEN** baris tersebut tersimpan dan dapat dibaca kembali tanpa error

### Requirement: Row Level Security membatasi akses publik

Row Level Security SHALL aktif pada semua tabel. Pengunjung tanpa autentikasi SHALL hanya dapat melakukan `SELECT` pada baris tabel konten dengan `is_published = true`, dan SHALL tidak dapat melakukan `INSERT`, `UPDATE`, atau `DELETE` pada tabel konten. Pengguna terautentikasi SHALL dapat membaca dan mengubah semua baris.

Untuk `messages` dan `ratings`, pengunjung tanpa autentikasi SHALL dapat melakukan `INSERT`, dan SHALL dapat melakukan `SELECT` hanya pada baris `ratings` yang sudah disetujui. Pengunjung tanpa autentikasi SHALL tidak dapat membaca `messages` sama sekali, tidak dapat membaca `ratings` yang belum disetujui, dan tidak dapat melakukan `UPDATE` maupun `DELETE` pada kedua tabel itu. Nilai yang menentukan status — penanda sudah dibaca pada pesan dan status persetujuan pada rating — SHALL tidak dapat ditentukan oleh pengunjung saat menyisipkan baris.

#### Scenario: Baris belum terbit tidak terlihat publik

- **WHEN** klien tanpa autentikasi membaca sebuah tabel konten yang berisi baris dengan `is_published = false`
- **THEN** baris tersebut tidak muncul di hasil

#### Scenario: Penulisan oleh publik ditolak

- **WHEN** klien tanpa autentikasi mencoba `INSERT`, `UPDATE`, atau `DELETE` pada tabel konten
- **THEN** operasi ditolak oleh kebijakan RLS

#### Scenario: Pesan dan rating tertutup dari publik

- **WHEN** klien tanpa autentikasi mencoba membaca `messages`, atau membaca `ratings` yang memuat baris belum disetujui
- **THEN** `messages` tidak mengembalikan baris apa pun — termasuk baris yang baru saja dikirim klien itu sendiri — dan `ratings` hanya mengembalikan baris yang sudah disetujui

#### Scenario: Publik tidak dapat menyetujui ratingnya sendiri

- **WHEN** klien tanpa autentikasi menyisipkan rating sambil menyertakan status disetujui bernilai benar
- **THEN** baris tersimpan dalam keadaan belum disetujui, atau operasi ditolak, dan rating itu tidak muncul di halaman publik

#### Scenario: Publik tidak dapat menandai pesannya sudah dibaca

- **WHEN** klien tanpa autentikasi menyisipkan pesan sambil menyertakan penanda sudah dibaca bernilai benar
- **THEN** baris tersimpan dengan penanda belum dibaca, atau operasi ditolak

#### Scenario: Publik tidak dapat mengubah atau menghapus kiriman

- **WHEN** klien tanpa autentikasi mencoba `UPDATE` atau `DELETE` pada `messages` maupun `ratings`
- **THEN** operasi ditolak oleh kebijakan RLS

#### Scenario: Pengguna terautentikasi melihat semua baris

- **WHEN** pengguna terautentikasi membaca sebuah tabel konten
- **THEN** baris dengan `is_published = false` juga ikut terlihat

### Requirement: Berkas media dapat diakses publik lewat Storage

Sistem SHALL menyediakan penyimpanan berkas untuk foto profil, thumbnail dan galeri proyek, gambar pencapaian, serta berkas CV. Berkas yang dirujuk oleh konten terbit SHALL dapat dibaca publik tanpa autentikasi. Mengunggah, mengubah, atau menghapus berkas SHALL hanya diizinkan untuk pengguna terautentikasi.

#### Scenario: Gambar dapat dimuat tanpa login

- **WHEN** pengunjung tanpa autentikasi membuka URL gambar yang dirujuk konten terbit
- **THEN** berkas gambar terkirim

#### Scenario: Unggahan oleh publik ditolak

- **WHEN** klien tanpa autentikasi mencoba mengunggah berkas ke penyimpanan
- **THEN** operasi ditolak

### Requirement: Data contoh tersedia untuk pengembangan lokal

Sistem SHALL menyediakan skrip seed yang mengisi setiap tabel konten dengan data contoh yang representatif — termasuk satu profil, beberapa tautan sosial, riwayat pendidikan, minimal dua kategori skill berisi skill, beberapa pengalaman dengan tipe berbeda, minimal empat proyek dengan sedikitnya dua di antaranya `featured`, dan beberapa pencapaian dari kedua kategori. Skrip seed SHALL dapat dijalankan ulang tanpa menghasilkan data duplikat.

#### Scenario: Situs tidak kosong setelah seed

- **WHEN** seed dijalankan pada database kosong lalu situs dibuka
- **THEN** setiap halaman publik menampilkan konten contoh, bukan empty state

#### Scenario: Seed dijalankan dua kali

- **WHEN** skrip seed dijalankan dua kali berurutan
- **THEN** skrip selesai tanpa error dan jumlah baris tetap sama seperti setelah proses pertama

### Requirement: Kolom tabel pesan dirinci secara eksplisit

Tabel `messages` SHALL menyimpan nama pengirim, email pengirim, subjek opsional, isi pesan, dan penanda sudah dibaca selain kolom audit yang sudah ditetapkan. Nama pengirim, email pengirim, dan isi pesan SHALL wajib ada.

#### Scenario: Pesan tanpa isi ditolak

- **WHEN** sebuah baris `messages` disisipkan tanpa isi pesan
- **THEN** database menolak operasi tersebut

#### Scenario: Subjek bersifat opsional

- **WHEN** sebuah pesan disimpan tanpa subjek
- **THEN** baris tersebut tersimpan dan dapat dibaca kembali tanpa error

### Requirement: Pesan masuk ditandai belum dibaca secara default

Tabel `messages` SHALL memiliki penanda sudah dibaca bertipe boolean yang bernilai false secara default, sehingga pesan yang baru masuk terhitung sebagai belum dibaca tanpa perlu diatur oleh pemanggil. Penanda ini SHALL hanya dapat diubah oleh pengguna terautentikasi.

#### Scenario: Pesan baru terhitung belum dibaca

- **WHEN** sebuah baris `messages` disisipkan tanpa menyertakan penanda sudah dibaca
- **THEN** baris tersebut tersimpan dengan penanda bernilai false

#### Scenario: Menghitung pesan belum dibaca

- **WHEN** jumlah pesan yang penandanya bernilai false diminta
- **THEN** hasilnya hanya menghitung pesan yang belum ditandai dibaca

#### Scenario: Publik tidak dapat mengubah penanda dibaca

- **WHEN** klien tanpa autentikasi mencoba mengubah penanda sudah dibaca pada sebuah pesan
- **THEN** operasi ditolak oleh kebijakan RLS

### Requirement: Pembatasan laju pengiriman dihitung di database

Sistem SHALL menyediakan penyimpanan dan satu fungsi database untuk membatasi laju pengiriman form publik. Fungsi tersebut SHALL mencatat satu percobaan beserta pengenal pengirim dan jenis form, lalu mengembalikan keputusan apakah percobaan itu diizinkan, dalam satu operasi atomik sehingga dua permintaan yang tiba bersamaan tidak dapat sama-sama lolos melebihi batas. Pengunjung tanpa autentikasi SHALL tidak dapat membaca maupun mengubah data penghitung itu secara langsung.

#### Scenario: Pengiriman di bawah batas diizinkan

- **WHEN** fungsi pembatasan laju dipanggil untuk pengirim yang percobaannya masih di bawah batas dalam jendela waktu berjalan
- **THEN** fungsi mengembalikan keputusan diizinkan dan mencatat percobaan itu

#### Scenario: Pengiriman melebihi batas ditolak

- **WHEN** fungsi dipanggil untuk pengirim yang sudah mencapai batas dalam jendela waktu berjalan
- **THEN** fungsi mengembalikan keputusan ditolak

#### Scenario: Batas kembali terbuka setelah jendela waktu lewat

- **WHEN** jendela waktu untuk seorang pengirim sudah terlampaui
- **THEN** percobaan berikutnya dari pengirim itu diizinkan kembali

#### Scenario: Dua permintaan bersamaan tidak sama-sama lolos

- **WHEN** dua permintaan dari pengirim yang sama tiba bersamaan saat hanya tersisa satu kuota
- **THEN** tepat satu di antaranya diizinkan

#### Scenario: Penghitung tertutup dari publik

- **WHEN** klien tanpa autentikasi mencoba membaca atau mengubah data penghitung pembatasan laju
- **THEN** operasi ditolak

#### Scenario: Catatan lama tidak menumpuk selamanya

- **WHEN** catatan percobaan sudah jauh melampaui jendela waktu yang dipakai
- **THEN** catatan itu dapat dihapus tanpa memengaruhi keputusan pembatasan laju yang berjalan

### Requirement: Tabel pesan dan rating dipakai halaman publik

Sistem SHALL menyediakan tabel `messages` (pesan dari form kontak) dan `ratings` (nama, bintang 1–5, komentar, status disetujui) beserta kebijakan aksesnya. Nilai bintang SHALL dibatasi pada bilangan bulat 1 sampai 5. Kedua tabel SHALL dipakai oleh halaman publik: pengunjung mengisi keduanya lewat form, dan rating yang sudah disetujui dibaca untuk ditampilkan.

#### Scenario: Bintang di luar rentang ditolak

- **WHEN** sebuah baris `ratings` disisipkan dengan nilai bintang 0 atau 6
- **THEN** database menolak operasi tersebut

#### Scenario: Pesan masuk dari halaman publik

- **WHEN** pengunjung mengirim form kontak dengan data yang sah
- **THEN** satu baris `messages` tersimpan dengan penanda belum dibaca

#### Scenario: Rating masuk dari halaman publik

- **WHEN** pengunjung mengirim rating dengan data yang sah
- **THEN** satu baris `ratings` tersimpan dalam keadaan belum disetujui
