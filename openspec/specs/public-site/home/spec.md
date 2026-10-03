# public-site/home Specification

## Purpose
Menetapkan perilaku beranda sebagai pintu masuk portofolio: perkenalan singkat pemilik, jalan cepat menuju proyek dan kontak, pengunduhan CV, dan cuplikan proyek pilihan.

## Requirements

### Requirement: Hero memperkenalkan pemilik portofolio

Beranda SHALL menampilkan hero berisi nama lengkap pemilik sebagai heading utama, tagline, dan foto profil, semuanya diambil dari profil di database. Foto profil SHALL memakai alt text yang menyebut nama pemilik.

#### Scenario: Hero menampilkan data profil

- **WHEN** pengunjung membuka beranda sementara profil sudah terisi
- **THEN** nama lengkap tampil sebagai heading level satu, tagline tampil di dekatnya, dan foto profil tampil dengan alt text yang menyebut nama pemilik

#### Scenario: Foto profil belum ada

- **WHEN** profil tidak memiliki URL foto
- **THEN** hero tetap dirender rapi dengan placeholder dan tanpa gambar rusak

### Requirement: Role tampil bergantian dengan animasi ketik

Hero SHALL menampilkan daftar role/headline dari profil secara bergantian dengan efek seperti sedang diketik. Urutan role SHALL mengikuti urutan yang tersimpan dan berulang terus. Teks role yang sedang tampil SHALL dapat diakses teknologi bantu tanpa membanjiri pengguna dengan pengumuman setiap karakter.

#### Scenario: Role bergantian berurutan

- **WHEN** profil memiliki beberapa role dan pengunjung memperhatikan hero
- **THEN** role ditampilkan satu per satu dengan efek ketik, mengikuti urutan tersimpan, lalu kembali ke role pertama

#### Scenario: Hanya ada satu role

- **WHEN** profil hanya memiliki satu role
- **THEN** role tersebut ditampilkan dalam keadaan diam tanpa siklus animasi

#### Scenario: Animasi ketik dinonaktifkan saat reduced motion

- **WHEN** pengunjung meminta gerak dikurangi
- **THEN** role ditampilkan sebagai teks statis, bukan animasi, dan seluruh role tetap dapat dibaca

### Requirement: Tombol aksi utama pada hero

Hero SHALL menampilkan tombol ke halaman proyek, tombol ke halaman kontak, tombol pratinjau CV, dan tombol mengunduh CV. Tombol unduh CV SHALL merujuk URL berkas CV dari profil dan dibuka di tab baru. Tombol pratinjau CV SHALL membuka berkas itu di modal tanpa meninggalkan halaman, dengan perilaku yang ditetapkan di kapabilitas `public-site/cv-preview`. Kedua tombol CV SHALL disembunyikan jika URL CV belum ada.

#### Scenario: Tombol mengantar ke halamannya

- **WHEN** pengunjung menekan tombol lihat proyek atau tombol kontak
- **THEN** pengunjung dibawa ke halaman proyek atau halaman kontak

#### Scenario: CV belum diunggah

- **WHEN** profil tidak memiliki URL berkas CV
- **THEN** tombol pratinjau CV dan tombol unduh CV sama-sama tidak dirender, dan tombol lainnya tetap tampil rapi

#### Scenario: Unduh CV

- **WHEN** profil memiliki URL berkas CV dan pengunjung menekan tombol unduh CV
- **THEN** berkas CV terbuka atau terunduh di tab baru

#### Scenario: Pratinjau CV

- **WHEN** profil memiliki URL berkas CV dan pengunjung menekan tombol pratinjau CV
- **THEN** berkas CV tampil di modal di atas halaman, tanpa berpindah halaman

### Requirement: Ikon sosial media pada hero

Hero SHALL menampilkan tautan sosial media terbit dari database sebagai ikon, menurut urutan tersimpan. Setiap ikon SHALL memiliki nama yang dapat diakses yang menyebut platformnya dan membuka tautan di tab baru.

#### Scenario: Ikon sosial tampil berurutan

- **WHEN** beranda dimuat sementara ada beberapa tautan sosial terbit
- **THEN** ikon tampil menurut urutan tersimpan, masing-masing dengan nama yang dapat diakses berisi nama platform

#### Scenario: Belum ada tautan sosial

- **WHEN** tidak ada tautan sosial terbit
- **THEN** bagian ikon sosial tidak dirender dan tata letak hero tetap rapi

### Requirement: Status terbuka untuk pekerjaan ditampilkan

Jika profil menandai dirinya terbuka untuk pekerjaan, beranda SHALL menampilkan penanda status yang terlihat. Jika tidak, penanda tersebut SHALL tidak dirender.

#### Scenario: Penanda tampil saat terbuka untuk pekerjaan

- **WHEN** profil menandai status terbuka untuk pekerjaan
- **THEN** beranda menampilkan penanda status berbahasa Indonesia yang menyatakan hal tersebut

#### Scenario: Penanda disembunyikan

- **WHEN** profil tidak menandai status terbuka untuk pekerjaan
- **THEN** tidak ada penanda status yang dirender

### Requirement: Cuplikan proyek featured pada beranda

Beranda SHALL menampilkan cuplikan proyek yang ditandai featured dan terbit, dalam tata letak bento grid, menurut urutan tersimpan. Setiap kartu SHALL menampilkan judul, ringkasan, thumbnail, dan tech stack, serta menautkan ke halaman detail proyek. Cuplikan SHALL menyertakan tautan menuju halaman proyek lengkap.

#### Scenario: Proyek featured tampil

- **WHEN** ada proyek featured yang terbit
- **THEN** beranda menampilkan kartu-kartunya menurut urutan tersimpan, masing-masing menautkan ke halaman detail proyek yang sesuai

#### Scenario: Belum ada proyek featured

- **WHEN** tidak ada proyek yang ditandai featured dan terbit
- **THEN** bagian cuplikan menampilkan empty state berbahasa Indonesia atau tidak dirender, dan beranda tetap dapat dibuka tanpa error

#### Scenario: Tautan ke daftar proyek lengkap

- **WHEN** pengunjung menekan tautan lihat semua proyek pada bagian cuplikan
- **THEN** pengunjung dibawa ke halaman daftar proyek

### Requirement: Beranda dapat dibuka walau profil belum ada

Jika belum ada baris profil di database, beranda SHALL tetap dirender tanpa error dan menampilkan empty state berbahasa Indonesia yang menjelaskan bahwa konten belum tersedia.

#### Scenario: Database kosong

- **WHEN** pengunjung membuka beranda sementara tabel profil kosong
- **THEN** halaman dirender dengan status sukses, menampilkan empty state berbahasa Indonesia, tanpa error runtime
