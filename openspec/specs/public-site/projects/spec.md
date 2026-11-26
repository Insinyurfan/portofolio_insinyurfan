# public-site/projects Specification

## Purpose
Menetapkan perilaku daftar proyek serta dialog dan halaman detail per proyek, sebagai bagian paling penting dari portofolio.

## Requirements

### Requirement: Halaman daftar proyek menampilkan grid

Halaman `/proyek` SHALL menampilkan semua proyek terbit sebagai grid kartu menurut urutan tersimpan. Setiap kartu SHALL menampilkan thumbnail, judul, dan ringkasan. Teknologi ditampilkan di detail proyek.

#### Scenario: Grid proyek dirender

- **WHEN** pengunjung membuka `/proyek` sementara ada beberapa proyek terbit
- **THEN** semua proyek terbit tampil sebagai kartu menurut urutan tersimpan, setiap kartu membuka dialog detailnya

#### Scenario: Thumbnail belum ada

- **WHEN** sebuah proyek tidak memiliki URL thumbnail
- **THEN** kartunya dirender dengan placeholder dan tanpa gambar rusak

#### Scenario: Belum ada proyek

- **WHEN** tidak ada proyek terbit
- **THEN** halaman menampilkan empty state berbahasa Indonesia dan tetap dirender dengan status sukses

### Requirement: Detail proyek terbuka dalam dialog

Memilih kartu proyek SHALL membuka detail dalam dialog dengan isi yang bisa digulir. Tombol tutup, klik latar, dan Escape SHALL menutup dialog dan mengembalikan fokus ke kartu. Galeri SHALL memperbesar foto di atas dialog proyek. Menutup satu foto SHALL mengembalikan pengunjung ke detail proyek.

Tautan langsung ke proyek SHALL dapat dibuka sebagai halaman sendiri. Alamat lama /proyek/tech/[tech] SHALL tetap menampilkan daftar proyek untuk teknologi yang sesuai. Slug teknologi yang tidak dikenal SHALL menjawab 404.

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
