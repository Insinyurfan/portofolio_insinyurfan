## Purpose

Menetapkan bagaimana halaman publik memperkenalkan dirinya ke mesin pencari dan platform berbagi tautan, serta seberapa cepat perubahan konten di database tercermin pada halaman yang di-cache.

## ADDED Requirements

### Requirement: Metadata per halaman diambil dari konten

Setiap halaman publik SHALL menyertakan judul dan deskripsi meta yang khas untuk halaman itu, dibangun dari konten database bila relevan. Judul SHALL memuat nama pemilik portofolio. Deskripsi SHALL berbahasa Indonesia dan panjangnya wajar untuk hasil pencarian.

#### Scenario: Judul khas per halaman

- **WHEN** judul dokumen dari setiap halaman publik dibandingkan
- **THEN** setiap halaman memiliki judul yang berbeda dan memuat nama pemilik

#### Scenario: Metadata halaman detail proyek

- **WHEN** halaman detail sebuah proyek dimuat
- **THEN** judul memuat judul proyek dan deskripsi meta diambil dari ringkasan proyek

#### Scenario: Metadata tetap ada walau konten kosong

- **WHEN** sebuah halaman dimuat sementara konten pendukungnya belum ada
- **THEN** halaman tetap memiliki judul dan deskripsi meta yang bermakna dari nilai fallback

### Requirement: Tag Open Graph dan kartu berbagi tautan

Setiap halaman publik SHALL menyertakan tag Open Graph berisi judul, deskripsi, URL kanonik, nama situs, tipe, dan gambar. Halaman detail proyek SHALL memakai thumbnail proyek sebagai gambar Open Graph; halaman lain SHALL memakai gambar bagi-pakai bawaan. Tag kartu Twitter yang setara SHALL disertakan.

#### Scenario: Tautan dibagikan ke media sosial

- **WHEN** URL halaman publik dibagikan ke platform yang membaca Open Graph
- **THEN** pratinjau menampilkan judul halaman, deskripsi, dan gambar yang sesuai

#### Scenario: Gambar Open Graph halaman proyek

- **WHEN** halaman detail proyek yang memiliki thumbnail dibagikan
- **THEN** gambar Open Graph adalah thumbnail proyek tersebut

#### Scenario: URL kanonik absolut

- **WHEN** tag Open Graph dari halaman publik mana pun diperiksa
- **THEN** URL yang tercantum absolut dan memakai URL dasar situs dari konfigurasi, bukan path relatif

### Requirement: Sitemap menyertakan setiap halaman publik

Situs SHALL menyajikan `sitemap.xml` yang memuat seluruh halaman publik statis beserta satu entri untuk setiap proyek terbit. Sitemap SHALL dibangun dari database sehingga proyek baru ikut masuk tanpa perubahan kode. Proyek yang belum terbit SHALL TIDAK muncul.

#### Scenario: Sitemap diambil

- **WHEN** `sitemap.xml` diminta
- **THEN** jawabannya adalah XML sitemap yang valid berisi entri untuk beranda, setiap halaman publik statis, dan setiap proyek terbit

#### Scenario: Proyek belum terbit dikecualikan

- **WHEN** sebuah proyek bernilai `is_published` false dan sitemap diminta
- **THEN** URL proyek tersebut tidak ada di dalam sitemap

#### Scenario: Proyek baru muncul otomatis

- **WHEN** proyek terbit baru ditambahkan ke database dan sitemap diminta ulang setelah revalidasi
- **THEN** URL proyek tersebut sudah ada tanpa perubahan kode

### Requirement: robots.txt mengizinkan perayapan dan menunjuk sitemap

Situs SHALL menyajikan `robots.txt` yang mengizinkan mesin pencari merayapi halaman publik dan mencantumkan URL absolut `sitemap.xml`.

#### Scenario: robots.txt diambil

- **WHEN** `robots.txt` diminta
- **THEN** jawabannya mengizinkan perayapan halaman publik dan memuat baris sitemap berisi URL absolut

### Requirement: Halaman publik di-cache dengan revalidasi berkala

Halaman publik SHALL dirender di server dan di-cache, dengan revalidasi berkala sehingga perubahan konten di database muncul tanpa deploy ulang. Perayap dan pengunjung SHALL menerima HTML yang sudah terisi konten, bukan kerangka halaman yang baru diisi di peramban.

#### Scenario: HTML sudah berisi konten

- **WHEN** halaman publik diminta tanpa menjalankan JavaScript
- **THEN** HTML yang dikirim sudah memuat teks konten utama halaman

#### Scenario: Perubahan konten muncul setelah revalidasi

- **WHEN** konten diubah di database dan halaman diminta ulang setelah periode revalidasi terlampaui
- **THEN** halaman menampilkan konten yang sudah diperbarui

#### Scenario: Halaman detail proyek dapat di-cache per slug

- **WHEN** halaman detail beberapa proyek berbeda diminta
- **THEN** masing-masing di-cache dan direvalidasi secara terpisah menurut slug-nya

### Requirement: Gambar dioptimasi dan diukur

Seluruh gambar konten pada halaman publik SHALL disajikan lewat pipeline optimasi gambar bawaan framework dengan dimensi atau rasio aspek yang eksplisit agar tata letak tidak bergeser. Host gambar jarak jauh yang dipakai SHALL diizinkan secara eksplisit di konfigurasi.

#### Scenario: Gambar tidak menggeser tata letak

- **WHEN** halaman berisi gambar dimuat pada koneksi lambat
- **THEN** ruang untuk setiap gambar sudah dicadangkan sebelum gambar selesai dimuat, sehingga konten di sekitarnya tidak bergeser

#### Scenario: Host gambar Supabase diizinkan

- **WHEN** gambar dari Supabase Storage dirender
- **THEN** gambar berhasil dimuat karena host-nya terdaftar di konfigurasi gambar
