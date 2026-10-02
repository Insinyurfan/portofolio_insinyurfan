## Purpose

Membuat situs dapat dirilis ke produksi dengan percaya diri: setiap variabel lingkungan terdaftar, kegagalan konfigurasi tertangkap sebelum deploy, dan pemilik tahu cara menghubungkan domainnya sendiri beserta apa yang harus ikut disesuaikan.

## ADDED Requirements

### Requirement: Seluruh variabel lingkungan terdaftar dan terklasifikasi

Repositori SHALL menyediakan satu daftar lengkap variabel lingkungan yang menyebut untuk setiap variabel: namanya, wajib atau opsional, apakah nilainya aman untuk ikut terkirim ke peramban, dan dari mana nilainya diperoleh. Daftar ini SHALL mencakup variabel Supabase, URL situs, email admin, dan kredensial layanan email. Tidak ada variabel yang memuat rahasia SHALL berawalan `NEXT_PUBLIC_`.

#### Scenario: Daftar variabel lengkap

- **WHEN** daftar variabel lingkungan dibandingkan dengan variabel yang benar-benar dibaca kode
- **THEN** keduanya cocok, tanpa variabel yang dibaca kode tetapi tidak terdaftar

#### Scenario: Rahasia tidak berawalan publik

- **WHEN** setiap variabel yang memuat rahasia diperiksa
- **THEN** tidak ada di antaranya yang berawalan `NEXT_PUBLIC_`

#### Scenario: Variabel wajib yang kurang menggagalkan lebih awal

- **WHEN** aplikasi dijalankan atau dibangun tanpa variabel wajib
- **THEN** prosesnya gagal dengan pesan yang menyebut nama variabel yang kurang

#### Scenario: Variabel opsional yang kurang tidak menggagalkan

- **WHEN** aplikasi dijalankan tanpa variabel opsional seperti kredensial layanan email
- **THEN** aplikasi tetap berjalan dan fitur yang bergantung padanya dilewati tanpa error

### Requirement: Pemeriksaan sebelum deploy dapat dijalankan dengan satu perintah

Repositori SHALL menyediakan satu perintah yang menjalankan pemeriksaan tipe, lint, dan build produksi secara berurutan dan gagal pada kesalahan pertama. Perintah ini SHALL dapat dijalankan di lokal dan menjadi dasar yang sama dengan yang dijalankan Vercel saat deploy.

#### Scenario: Pemeriksaan lulus

- **WHEN** perintah pemeriksaan dijalankan pada repositori yang sehat dengan variabel lingkungan terisi
- **THEN** pemeriksaan tipe, lint, dan build produksi selesai tanpa error

#### Scenario: Pemeriksaan gagal lebih awal

- **WHEN** ada error tipe di dalam kode
- **THEN** perintah berhenti dengan status gagal dan menyebut error itu, tanpa melanjutkan ke build

#### Scenario: Build produksi mencerminkan deploy

- **WHEN** build produksi lulus di lokal dengan variabel lingkungan yang sama dengan produksi
- **THEN** build di Vercel juga lulus tanpa kegagalan yang hanya muncul di sana

### Requirement: Panduan deploy ke Vercel tersedia di README

README SHALL memuat langkah deploy ke Vercel dari awal: menghubungkan repositori, mengatur setiap variabel lingkungan beserta lingkungan tempatnya diatur, menjalankan pemeriksaan sebelum deploy, langkah manual yang harus dilakukan di Supabase, dan cara memverifikasi bahwa situs produksi berjalan benar.

#### Scenario: Deploy pertama mengikuti README

- **WHEN** pemilik mengikuti bagian deploy di README dari atas ke bawah
- **THEN** ia mencapai situs produksi yang berjalan berisi konten dari database, tanpa perlu informasi di luar dokumen itu

#### Scenario: Langkah manual Supabase disebut

- **WHEN** bagian deploy dibaca
- **THEN** di sana tercantum bahwa signup harus dimatikan, akun admin dibuat manual, dan migrasi diterapkan ke proyek produksi

#### Scenario: Verifikasi setelah deploy

- **WHEN** bagian verifikasi setelah deploy diikuti
- **THEN** di sana tercantum pemeriksaan bahwa halaman publik menampilkan konten, `/admin` mengalihkan ke login tanpa sesi, form kontak dapat mengirim, dan `sitemap.xml` serta `robots.txt` dapat diambil

### Requirement: Panduan custom domain menyebut akibatnya pada URL situs

README SHALL memuat langkah menghubungkan custom domain ke Vercel, termasuk catatan DNS yang perlu diatur, dan SHALL menyatakan secara eksplisit bahwa variabel URL situs harus diperbarui ke domain baru lalu aplikasi di-deploy ulang, karena URL kanonik, tag Open Graph, dan `sitemap.xml` dibangun dari variabel itu.

#### Scenario: Domain dihubungkan

- **WHEN** pemilik mengikuti panduan custom domain
- **THEN** domainnya melayani situs lewat HTTPS

#### Scenario: Akibat pada URL kanonik disebut

- **WHEN** panduan custom domain dibaca
- **THEN** di sana dinyatakan bahwa variabel URL situs harus diperbarui dan aplikasi di-deploy ulang, dengan alasan bahwa URL kanonik, Open Graph, dan sitemap ikut berubah

#### Scenario: Verifikasi setelah domain aktif

- **WHEN** panduan diikuti sampai selesai
- **THEN** di sana tercantum pemeriksaan bahwa `sitemap.xml` memuat domain baru dan tag Open Graph menunjuk domain baru, bukan domain bawaan Vercel

### Requirement: Konfigurasi produksi dan lokal tidak saling tertukar

README SHALL menyatakan bahwa skrip seed data contoh tidak boleh dijalankan pada database produksi setelah konten asli dimasukkan, dan bahwa migrasi diterapkan ke produksi lewat perintah yang terpisah dari alur pengembangan lokal.

#### Scenario: Peringatan seed ada di tempat yang terlihat

- **WHEN** bagian deploy dibaca
- **THEN** di sana ada peringatan eksplisit untuk tidak menjalankan seed pada database produksi

#### Scenario: Migrasi produksi dibedakan dari lokal

- **WHEN** bagian deploy dibaca
- **THEN** perintah untuk menerapkan migrasi ke proyek produksi disebut terpisah dari perintah reset database lokal
