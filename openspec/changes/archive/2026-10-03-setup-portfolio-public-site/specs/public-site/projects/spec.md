## Purpose

Menetapkan perilaku daftar proyek dengan penyaringan berdasarkan tech stack dan halaman detail per proyek, sebagai bagian paling penting dari portofolio.

## ADDED Requirements

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

Halaman `/proyek` SHALL menyediakan kontrol penyaringan yang dibangun dari gabungan seluruh nilai tech stack pada proyek terbit. Memilih sebuah tech stack SHALL mempersempit grid menjadi proyek yang memuat nilai tersebut. SHALL tersedia pilihan untuk kembali menampilkan semua proyek. Penyaringan SHALL berlangsung tanpa memuat ulang halaman penuh.

#### Scenario: Menyaring menurut satu tech stack

- **WHEN** pengunjung memilih sebuah tech stack dari kontrol filter
- **THEN** grid hanya menampilkan proyek terbit yang memuat tech stack tersebut, dan filter yang aktif ditandai secara visual

#### Scenario: Mengosongkan filter

- **WHEN** pengunjung memilih opsi menampilkan semua setelah sebelumnya menyaring
- **THEN** grid kembali menampilkan semua proyek terbit menurut urutan tersimpan

#### Scenario: Filter tidak menghasilkan apa pun

- **WHEN** sebuah filter aktif tidak mencocokkan proyek mana pun
- **THEN** halaman menampilkan empty state berbahasa Indonesia yang menyarankan mengosongkan filter, dan kontrol filter tetap dapat dipakai

#### Scenario: Pilihan filter dibangun dari data

- **WHEN** kontrol filter dirender
- **THEN** pilihan yang tersedia hanya tech stack yang benar-benar dipakai oleh proyek terbit, tanpa duplikat dan tanpa daftar yang ditulis di kode

#### Scenario: Filter dapat dioperasikan dengan keyboard

- **WHEN** pengunjung menelusuri kontrol filter hanya dengan keyboard
- **THEN** setiap pilihan dapat dicapai dan diaktifkan dengan keyboard, dengan indikator fokus terlihat dan status terpilih diumumkan ke teknologi bantu

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
