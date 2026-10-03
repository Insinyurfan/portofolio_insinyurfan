# public-site/projects Specification

## Purpose
Menetapkan perilaku daftar proyek dengan penyaringan berdasarkan tech stack dan halaman detail per proyek, sebagai bagian paling penting dari portofolio.

## Requirements

### Requirement: Halaman daftar proyek menampilkan grid

Halaman `/proyek` SHALL menampilkan semua proyek terbit sebagai grid kartu menurut urutan tersimpan. Setiap kartu SHALL menampilkan thumbnail, judul, ringkasan, dan daftar tech stack, serta menautkan ke halaman detail proyek yang sesuai.

#### Scenario: Grid proyek dirender

- **WHEN** pengunjung membuka `/proyek` sementara ada beberapa proyek terbit
- **THEN** semua proyek terbit tampil sebagai kartu menurut urutan tersimpan, masing-masing menautkan ke halaman detailnya

#### Scenario: Thumbnail belum ada

- **WHEN** sebuah proyek tidak memiliki URL thumbnail
- **THEN** kartunya dirender dengan placeholder dan tanpa gambar rusak

#### Scenario: Belum ada proyek

- **WHEN** tidak ada proyek terbit
- **THEN** halaman menampilkan empty state berbahasa Indonesia dan tetap dirender dengan status sukses

### Requirement: Daftar proyek dapat disaring menurut tech stack

Halaman `/proyek` SHALL menyediakan kontrol penyaringan yang dibangun dari gabungan seluruh nilai tech stack pada proyek terbit. Setiap pilihan SHALL berupa tautan ke alamatnya sendiri, `/proyek/tech/[tech]`, dan BUKAN parameter kueri pada `/proyek`. Memilih sebuah tech stack SHALL membawa pengunjung ke halaman yang hanya memuat proyek terbit dengan nilai tersebut. SHALL tersedia tautan untuk kembali menampilkan semua proyek. Halaman `/proyek` maupun setiap `/proyek/tech/[tech]` SHALL dapat dirender statis dan di-cache, dan kontrol filternya SHALL tidak memerlukan JavaScript.

Slug tech stack yang tidak dipakai proyek terbit mana pun SHALL menjawab 404, bukan daftar kosong.

#### Scenario: Menyaring menurut satu tech stack

- **WHEN** pengunjung memilih sebuah tech stack dari kontrol filter
- **THEN** pengunjung dibawa ke `/proyek/tech/[tech]` yang hanya menampilkan proyek terbit dengan tech stack tersebut, dan filter yang aktif ditandai secara visual beserta `aria-current="page"`

#### Scenario: Mengosongkan filter

- **WHEN** pengunjung memilih pilihan "Semua"
- **THEN** pengunjung dibawa kembali ke `/proyek` yang menampilkan seluruh proyek terbit

#### Scenario: Halaman terfilter dapat di-cache

- **WHEN** `/proyek` atau `/proyek/tech/[tech]` diminta di produksi
- **THEN** halaman dilayani dari cache CDN, bukan dirender ulang pada setiap kunjungan

#### Scenario: Slug tech stack tidak dikenal

- **WHEN** pengunjung membuka `/proyek/tech/` dengan slug yang tidak dipakai proyek terbit mana pun
- **THEN** situs menjawab 404

#### Scenario: Filter berfungsi tanpa JavaScript

- **WHEN** halaman `/proyek` dibuka dengan JavaScript dimatikan
- **THEN** seluruh pilihan filter tetap dapat ditelusuri dan diaktifkan sebagai tautan biasa

#### Scenario: Filter tidak menghasilkan apa pun

- **WHEN** sebuah filter aktif tidak mencocokkan proyek mana pun
- **THEN** halaman menampilkan empty state berbahasa Indonesia yang menyarankan mengosongkan filter, dan kontrol filter tetap dapat dipakai

#### Scenario: Pilihan filter dibangun dari data

- **WHEN** kontrol filter dirender
- **THEN** pilihan yang tersedia hanya tech stack yang benar-benar dipakai oleh proyek terbit, tanpa duplikat dan tanpa daftar yang ditulis di kode

#### Scenario: Filter dapat dioperasikan dengan keyboard

- **WHEN** pengunjung menelusuri kontrol filter hanya dengan keyboard
- **THEN** setiap pilihan dapat difokus, cincin fokusnya terlihat, dan menekan Enter mengaktifkan filternya

### Requirement: Halaman detail proyek

Halaman `/proyek/[slug]` SHALL menampilkan judul, ringkasan, deskripsi lengkap, daftar tech stack, dan galeri gambar dari proyek yang bersangkutan. Jika tersedia, halaman SHALL menampilkan tautan demo langsung dan tautan repositori yang membuka di tab baru. Halaman SHALL menyertakan tautan kembali ke daftar proyek.

#### Scenario: Detail proyek dirender

- **WHEN** pengunjung membuka halaman detail sebuah proyek terbit
- **THEN** judul, deskripsi lengkap, tech stack, dan galeri gambar proyek tersebut ditampilkan

#### Scenario: Tautan opsional disembunyikan

- **WHEN** sebuah proyek tidak memiliki link demo atau link repositori
- **THEN** tombol untuk tautan yang tidak ada tidak dirender, dan tombol lainnya tetap tampil rapi

#### Scenario: Galeri kosong

- **WHEN** sebuah proyek tidak memiliki gambar galeri
- **THEN** halaman detail dirender tanpa bagian galeri dan tanpa gambar rusak

#### Scenario: Gambar galeri memiliki alt text

- **WHEN** galeri proyek dirender
- **THEN** setiap gambar memiliki alt text yang menyebut judul proyek

### Requirement: Slug yang tidak ditemukan menghasilkan halaman 404

Membuka `/proyek/[slug]` dengan slug yang tidak cocok dengan proyek terbit mana pun SHALL menghasilkan halaman tidak ditemukan dengan status HTTP 404. Proyek yang belum terbit SHALL TIDAK dapat diakses lewat slug-nya oleh pengunjung tanpa autentikasi.

#### Scenario: Slug tidak dikenal

- **WHEN** pengunjung membuka halaman detail proyek dengan slug yang tidak ada
- **THEN** server menjawab dengan status 404 dan halaman tidak ditemukan berbahasa Indonesia

#### Scenario: Proyek belum terbit tidak dapat diakses

- **WHEN** pengunjung tanpa autentikasi membuka slug proyek yang `is_published` bernilai false
- **THEN** server menjawab dengan status 404, bukan menampilkan isi proyek tersebut
